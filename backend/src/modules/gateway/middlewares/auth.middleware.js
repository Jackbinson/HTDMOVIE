const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'htdmovie_secret_key_123';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục!' });
  }

  try {
    // 2. Giải mã token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 3. Gắn thông tin user vào biến req để các hàm sau dùng
    req.user = decoded; 
    
    // 4. Cho phép đi tiếp
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

module.exports = authMiddleware;