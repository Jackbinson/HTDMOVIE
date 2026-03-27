// src/modules/gateway/middlewares/error.middleware.js
const multer = require('multer');

// 👇 SỬA DÒNG NÀY: Giảm bớt một dấu "../" (Vì folder utils nằm cùng cấp với gateway)
const logger = require('../../utils/logger');
const errorMiddleware = (err, req, res, next) => {
  // 1. Ghi log (Nếu logger lỗi thì dùng console.error dự phòng)
  if (logger && logger.error) {
    logger.error(err);
  } else {
    console.error('🔥 ERROR LOG:', err);
  }

  // 2. Mặc định là lỗi 500
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Lỗi máy chủ nội bộ';
  let details = err.details || null;

  // 3. Xử lý lỗi Multer
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File quá lớn! Vui lòng chọn ảnh dưới 5MB.';
    } else {
      message = `Lỗi upload file: ${err.message}`;
    }
  }

  // 4. Xử lý lỗi JSON Syntax
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Dữ liệu JSON gửi lên bị lỗi cú pháp.';
  }

  // 5. Trả về
  res.status(statusCode).json({
    success: false,
    message: message,
    details: details,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack 
  });
};

module.exports = errorMiddleware;