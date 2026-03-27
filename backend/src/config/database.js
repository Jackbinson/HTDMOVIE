// src/config/database.js
const { Pool } = require('pg');
const path = require('path');

// 1. Đảm bảo load đúng file .env từ thư mục gốc
const envPath = path.resolve(__dirname, '../../.env');
require('dotenv').config({ path: envPath });

// --- ĐOẠN DEBUG (Xóa sau khi chạy được) ---
console.log("--- KIỂM TRA BIẾN MÔI TRƯỜNG ---");
console.log("Đường dẫn file .env:", envPath);
console.log("DB_USER:", process.env.DB_USER);
console.log("Mật khẩu có tồn tại không?:", process.env.DB_PASSWORD ? "CÓ" : "KHÔNG (ĐANG BỊ TRỐNG)");
// -----------------------------------------

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres', 
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
});

pool.on('error', (err) => {
  console.error('Lỗi Pool PostgreSQL bất ngờ:', err);
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Lỗi kết nối Database:', err.message);
    return;
  }
  console.log('✅ Đã kết nối thành công tới PostgreSQL: ' + (process.env.DB_NAME || 'QLPHIMDB'));
  release();
});

module.exports = pool;