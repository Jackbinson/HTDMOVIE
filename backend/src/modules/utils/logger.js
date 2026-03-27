// src/utils/logger.js
const winston = require('winston');
const path = require('path');

// Định nghĩa các level log
// error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6

const logger = winston.createLogger({
  level: 'info', // Ghi từ level info trở lên (bỏ qua debug)
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }), // Ghi rõ ngăn xếp lỗi (stack trace)
    winston.format.json() // Lưu file dưới dạng JSON để máy dễ đọc
  ),
  defaultMeta: { service: 'htdmovie-backend' },
  transports: [
    // 1. Ghi lỗi (Error) vào file riêng
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error' 
    }),
    // 2. Ghi tất cả (Info, Warn, Error) vào file chung
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/combined.log') 
    }),
  ],
});

// Nếu không phải môi trường Production thì in ra Console có màu sắc cho dễ nhìn
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} [${level}]: ${message}`;
      })
    ),
  }));
}

module.exports = logger;