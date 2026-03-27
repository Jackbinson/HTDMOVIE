-- ==============================================================
-- FILE 1: ENTITIES & SCHEMA (CẤU TRÚC DỮ LIỆU)
-- Chạy file này trước để tạo bảng và dữ liệu mẫu
-- ==============================================================

-- 1. DỌN DẸP (CLEANUP) - Xóa bảng cũ để tránh lỗi conflict
-- Lưu ý: Dùng CASCADE để xóa luôn các ràng buộc khóa ngoại liên quan
DROP TABLE IF EXISTS show_seats CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS shows CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. TẠO BẢNG (SCHEMA)

-- Bảng Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Mật khẩu đã mã hóa
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Rooms (Phòng chiếu)
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    total_seats INT DEFAULT 0
);

-- Bảng Shows (Suất chiếu)
CREATE TABLE shows (
    id SERIAL PRIMARY KEY,
    movie_name VARCHAR(255) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 100000,
    room_id INT REFERENCES rooms(id)
);

-- Bảng Bookings (Đơn hàng/Thanh toán)
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    show_id INT REFERENCES shows(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, COMPLETED, CANCELLED
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Show Seats (Ghế ngồi)
CREATE TABLE show_seats (
    id SERIAL PRIMARY KEY,
    show_id INT REFERENCES shows(id),
    seat_code VARCHAR(10) NOT NULL,
    status INT DEFAULT 0, 
    booking_id INT REFERENCES bookings(id),
    holder_id INT REFERENCES users(id),
    held_expires_at TIMESTAMP,        
    UNIQUE(show_id, seat_code)
);

-- 3. DỮ LIỆU MẪU (SEED DATA)

-- Tạo User mẫu (Pass: 123456 -> hash)
INSERT INTO users (username, password_hash, full_name) 
VALUES ('jack_dev', '$2b$10$Hahed...', 'Jack Developer');

-- Tạo Phòng
INSERT INTO rooms (name, total_seats) VALUES 
('Cinema 01', 100),
('Cinema VIP', 50);

-- Tạo Suất chiếu (Gắn vào Phòng 01)
INSERT INTO shows (movie_name, start_time, price, room_id) 
VALUES ('Avenger: Endgame', NOW() + INTERVAL '1 day', 120000, 1);

-- Tạo 4 Ghế mẫu cho suất chiếu đó
INSERT INTO show_seats (show_id, seat_code) VALUES 
(1, 'A1'), (1, 'A2'), (1, 'B1'), (1, 'B2');