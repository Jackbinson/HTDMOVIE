const pool = require('../../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'htdmovie_secret_key_123';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'htdmovie_refresh_secret_key_456';

const generateTokens = user => {
  const accessToken = jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, {
    expiresIn: '7d'
  });

  return { accessToken, refreshToken };
};

exports.register = async (req, res, next) => {
  try {
    const payload = {
      username: req.body?.username?.trim(),
      password: req.body?.password,
      fullName: req.body?.fullName?.trim() || null,
      email: req.body?.email?.trim().toLowerCase()
    };

    const schema = Joi.object({
      username: Joi.string().pattern(new RegExp('^[a-zA-Z0-9._-]+$')).min(3).max(30).required(),
      password: Joi.string().min(6).required(),
      fullName: Joi.string().allow('', null).optional(),
      email: Joi.string().email().required()
    });

    const { error } = schema.validate(payload);
    if (error) {
      logger.warn(`Dang ky that bai (validate): ${error.details[0].message}`);
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const userExist = await pool.query(
      'SELECT id, username, email FROM users WHERE username = $1 OR email = $2',
      [payload.username, payload.email]
    );

    if (userExist.rows.length > 0) {
      const existingUser = userExist.rows[0];
      const conflictField = existingUser.username === payload.username ? 'Username' : 'Email';

      return res.status(409).json({
        success: false,
        message: `${conflictField} nay da ton tai!`
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(payload.password, salt);

    const newUser = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, full_name`,
      [payload.username, payload.email, hashedPassword, payload.fullName]
    );

    logger.info(`Dang ky thanh cong user moi: ${payload.username}`);
    return res.status(201).json({
      success: true,
      message: 'Dang ky thanh cong!',
      data: newUser.rows[0]
    });
  } catch (err) {
    logger.error(`Loi he thong khi dang ky: ${err.message}`);
    return next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const loginIdentifier = (email || username || '').trim().toLowerCase();

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui long cung cap tai khoan/email va mat khau'
      });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $1',
      [loginIdentifier]
    );

    if (result.rows.length === 0) {
      logger.warn(`Dang nhap that bai (sai tai khoan): ${loginIdentifier}`);
      return res.status(400).json({
        success: false,
        message: 'Sai ten dang nhap hoac mat khau'
      });
    }

    const user = result.rows[0];
    const validPass = await bcrypt.compare(password, user.password_hash);

    if (!validPass) {
      logger.warn(`Dang nhap that bai (sai mat khau) cho user: ${user.username}`);
      return res.status(400).json({
        success: false,
        message: 'Sai ten dang nhap hoac mat khau'
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [
      refreshToken,
      user.id
    ]);

    logger.info(`User dang nhap thanh cong: ${user.username} (Role: ${user.role})`);

    return res.json({
      success: true,
      message: 'Dang nhap thanh cong',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    logger.error(`Loi he thong khi login: ${err.message}`);
    return next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Vui long cung cap Refresh Token!'
      });
    }

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        logger.warn('Refresh Token khong hop le hoac da het han.');
        return res.status(403).json({
          success: false,
          message: 'Phien dang nhap het han. Vui long dang nhap lai!'
        });
      }

      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1 AND refresh_token = $2',
        [decoded.id, refreshToken]
      );
      const user = result.rows[0];

      if (!user) {
        logger.warn(`Phat hien token gia mao hoac da bi thu hoi (User ID: ${decoded.id})`);
        return res.status(403).json({
          success: false,
          message: 'Token khong hop le!'
        });
      }

      const newTokens = generateTokens(user);

      await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [
        newTokens.refreshToken,
        user.id
      ]);

      logger.info(`Da cap lai token moi cho user: ${user.username}`);

      return res.json({
        success: true,
        message: 'Lam moi token thanh cong!',
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken
      });
    });
  } catch (err) {
    logger.error(`Loi he thong khi refresh token: ${err.message}`);
    return next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const email = req.body?.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui long cung cap email de khoi phuc tai khoan.'
      });
    }

    const result = await pool.query('SELECT id, username, email FROM users WHERE email = $1', [
      email
    ]);

    if (result.rows.length > 0) {
      logger.info(`Yeu cau quen mat khau cho email: ${email}`);
    } else {
      logger.warn(`Yeu cau quen mat khau cho email khong ton tai: ${email}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Neu email ton tai trong he thong, huong dan khoi phuc da duoc gui.'
    });
  } catch (err) {
    logger.error(`Loi he thong khi xu ly quen mat khau: ${err.message}`);
    return next(err);
  }
};
