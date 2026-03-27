const pool = require('../../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi'); 
const logger = require('../utils/logger'); 

const JWT_SECRET = process.env.JWT_SECRET || 'htdmovie_secret_key_123';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'htdmovie_refresh_secret_key_456';

// --- HÀM HỖ TRỢ TẠO CẶP TOKEN ---
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role }, 
    JWT_SECRET, 
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id }, 
    JWT_REFRESH_SECRET, 
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// --- 1. ĐĂNG KÝ (REGISTER) ---
exports.register = async (req, res, next) => {
  try {
    const { username, password, fullName, email } = req.body;
    const schema = Joi.object({
      username: Joi.string().pattern(new RegExp('^[a-zA-Z0-9._-]+$')).min(3).max(30).required(),
      password: Joi.string().min(6).required(),
      fullName: Joi.string().optional(),
      email: Joi.string().email().required() // <-- Đã sửa
    });
    
    const { error } = schema.validate(req.body);
    if (error) {
        logger.warn(`Đăng ký thất bại (Validate): ${error.details[0].message}`);
        return res.status(400).json({ success: false, message: error.details[0].message });
    }

    // Kiểm tra xem Username HOẶC Email đã tồn tại chưa
    const userExist = await pool.query(
      'SELECT id, username, email FROM users WHERE username = $1 OR email = $2', 
      [username, email]
    );
    
    if (userExist.rows.length > 0) {
      const existingUser = userExist.rows[0];
      const conflictField = existingUser.username === username ? 'Username' : 'Email';
      return res.status(400).json({ success: false, message: `${conflictField} này đã tồn tại!` });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Cập nhật câu lệnh INSERT để lưu thêm email
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password_hash, full_name) VALUES ($1, $2, $3, $4) RETURNING id, username, email, full_name',
      [username, email, hashedPassword, fullName]
    );

    logger.info(`Đăng ký thành công user mới: ${username}`);
    res.status(201).json({ success: true, message: 'Đăng ký thành công!', data: newUser.rows[0] });

  } catch (err) {
    logger.error(`Lỗi hệ thống khi đăng ký: ${err.message}`);
    next(err); 
  }
};

// --- 2. ĐĂNG NHẬP (LOGIN) ---
exports.login = async (req, res, next) => {
  try {
    // Client có thể gửi 'username' (chứa tên hoặc email) HOẶC 'email' rõ ràng
    const { username, email, password } = req.body;
    
    // Gom chung giá trị đăng nhập thành 1 biến identifier
    const loginIdentifier = email || username;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tài khoản/email và mật khẩu' });
    }

    // Truy vấn linh hoạt: Tìm user theo email HOẶC username
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $1', 
      [loginIdentifier]
    );

    if (result.rows.length === 0) {
      logger.warn(`Đăng nhập thất bại (Sai tài khoản): ${loginIdentifier}`);
      return res.status(400).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' });
    }
    
    const user = result.rows[0];

    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) {
      logger.warn(`Đăng nhập thất bại (Sai pass) cho user: ${user.username}`);
      return res.status(400).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    // 1. Tạo cặp Token mới
    const { accessToken, refreshToken } = generateTokens(user);

    // 2. Lưu Refresh Token vào Database
    await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

    logger.info(`User đăng nhập thành công: ${user.username} (Role: ${user.role})`);

    // 3. Trả về cả 2 Token cho Client
    res.json({ 
      success: true, 
      message: 'Đăng nhập thành công',
      accessToken: accessToken, 
      refreshToken: refreshToken, 
      user: { 
        id: user.id, 
        name: user.full_name,
        email: user.email,
        role: user.role 
      } 
    });

  } catch (err) {
    logger.error(`Lỗi hệ thống khi login: ${err.message}`);
    next(err);
  }
}; 

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Vui lòng cung cấp Refresh Token!' });
    }

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        logger.warn('Refresh Token không hợp lệ hoặc đã hết hạn.');
        return res.status(403).json({ success: false, message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!' });
      }
      const result = await pool.query('SELECT * FROM users WHERE id = $1 AND refresh_token = $2', [decoded.id, refreshToken]);
      const user = result.rows[0];

      if (!user) {
        logger.warn(`Phát hiện Token giả mạo hoặc đã bị thu hồi (User ID: ${decoded.id})`);
        return res.status(403).json({ success: false, message: 'Token không hợp lệ!' });
      }

      // 3. Cấp lại cặp Token mới (Refresh Token Rotation - Bảo mật cao)
      const newTokens = generateTokens(user);

      // Cập nhật Refresh Token mới vào DB
      await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [newTokens.refreshToken, user.id]);

      logger.info(`Đã cấp lại Token mới cho user: ${user.username}`);

      // 4. Trả về cho Client
      res.json({
        success: true,
        message: 'Làm mới Token thành công!',
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken
      });
    });

  } catch (err) {
    logger.error(`Lỗi hệ thống khi Refresh Token: ${err.message}`);
    next(err);
  }
};