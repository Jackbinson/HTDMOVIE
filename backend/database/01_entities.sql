-- ==============================================================
-- 1. DỌN DẸP (CLEANUP)
-- ==============================================================
DROP VIEW IF EXISTS v_booking_overview CASCADE;
DROP VIEW IF EXISTS v_trending_shows CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS show_seats CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS shows CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==============================================================
-- 2. TẠO BẢNG (SCHEMA)
-- ==============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Bổ sung Role 'staff' vào bảng users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user', 
    CHECK (role IN ('user', 'admin', 'staff')), -- Ràng buộc phân quyền
    refresh_token TEXT,              
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    total_seats INT DEFAULT 0
);

-- Bảng Shows tích hợp chỉ số AI và Trailer
CREATE TABLE shows (
    id SERIAL PRIMARY KEY,
    movie_name VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    duration INT DEFAULT 120,
    price DECIMAL(10, 2) NOT NULL DEFAULT 100000,
    room_id INT REFERENCES rooms(id),
    poster_url VARCHAR(255),
    trailer_id VARCHAR(255) DEFAULT '',
    views INT DEFAULT 0,
    bookings_count INT DEFAULT 0,
    admin_boost INT DEFAULT 0,
    is_hot BOOLEAN DEFAULT FALSE
);

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    show_id INT REFERENCES shows(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'PENDING',
    CHECK (payment_status IN ('PENDING', 'COMPLETED', 'CANCELLED', 'FAILED')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Tickets: Thực thể con phục vụ việc soát vé của Staff
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
    show_id INT REFERENCES shows(id),
    seat_code VARCHAR(10) NOT NULL,
    ticket_code VARCHAR(100) UNIQUE, -- Mã để Staff quét QR
    is_used BOOLEAN DEFAULT FALSE,   -- Trạng thái soát vé (Check-in)
    price_at_purchase DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE show_seats (
    id SERIAL PRIMARY KEY,
    show_id INT REFERENCES shows(id),
    seat_code VARCHAR(10) NOT NULL,
    status INT DEFAULT 0, -- 0: Trống, 1: Đang giữ, 2: Đã bán
    booking_id INT REFERENCES bookings(id),
    holder_id INT REFERENCES users(id), 
    held_expires_at TIMESTAMP,           
    UNIQUE(show_id, seat_code)
);

-- ==============================================================
-- 3. TRÍ THÔNG MINH NHÂN TẠO (AI VIEW)
-- ==============================================================

CREATE OR REPLACE VIEW v_trending_shows AS
SELECT *, 
       (views * 0.3 + bookings_count * 0.7 + admin_boost) AS trending_score
FROM shows;

CREATE OR REPLACE VIEW v_booking_overview AS
SELECT
    b.id AS booking_id,
    u.id AS user_id,
    u.username,
    u.full_name,
    u.email,
    s.id AS show_id,
    s.movie_name,
    s.start_time,
    s.price AS ticket_price,
    r.id AS room_id,
    r.name AS room_name,
    b.total_amount,
    b.payment_status,
    b.created_at
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN shows s ON b.show_id = s.id
JOIN rooms r ON s.room_id = r.id;

-- ==============================================================
-- 4. DỮ LIỆU MẪU (SEED DATA)
-- ==============================================================

-- Thêm User, Admin và Staff
-- Tai khoan admin moi:
-- Email: boss@htdmovie.com
-- Username: boss_admin
-- Mat khau tam thoi: Boss@123456
INSERT INTO users (username, password_hash, full_name, email, role) VALUES 
('jack_dev', crypt('Jack@123456', gen_salt('bf')), 'Jack Developer', 'jack_dev@example.com', 'user'),
('super_admin', crypt('Admin@123456', gen_salt('bf')), 'Quản Trị Viên', 'admin@htdmovie.com', 'admin'),
('boss_admin', crypt('Boss@123456', gen_salt('bf')), 'Boss HTD Movie', 'boss@htdmovie.com', 'admin'),
('tuan_staff', crypt('Staff@123456', gen_salt('bf')), 'NV Soát Vé Tuấn', 'tuan_staff@htdmovie.com', 'staff');

INSERT INTO rooms (name, total_seats) VALUES 
('Cinema 01 - Standard', 100),
('Cinema 02 - VIP', 50);

-- Nạp phim kèm chỉ số Hot giả lập
INSERT INTO shows (movie_name, description, start_time, duration, price, room_id, poster_url, trailer_id, admin_boost, views) VALUES 
('Dune: Part Two', 'Cuộc chiến sa mạc rực lửa.', NOW() + INTERVAL '5 hours', 166, 120000, 1, '/uploads/dune2.jpg', 'Way9Dexny3w', 8000, 150),
('Avenger: Endgame', 'Hồi kết của các siêu anh hùng.', NOW() + INTERVAL '1 day', 180, 120000, 1, '/uploads/avenger.jpg', 'TcMBFSG61XY', 0, 45),
('Spider-Man: No Way Home', 'Người nhện và đa vũ trụ.', NOW() + INTERVAL '2 hours', 148, 150000, 2, '/uploads/spiderman.jpg', 'JfVOs4VSpmA', 5000, 80);

-- Giả lập một giao dịch đã thành công
INSERT INTO bookings (user_id, show_id, total_amount, payment_status) 
VALUES (1, 1, 240000, 'COMPLETED');

-- Xuất vé cho giao dịch trên
INSERT INTO tickets (booking_id, show_id, seat_code, ticket_code, price_at_purchase) VALUES 
(1, 1, 'A1', 'TKT-DUNE-A1-QR123', 120000),
(1, 1, 'A2', 'TKT-DUNE-A2-QR456', 120000);

-- Cập nhật trạng thái ghế trong rạp
INSERT INTO show_seats (show_id, seat_code, status, booking_id, holder_id) VALUES 
(1, 'A1', 2, 1, 1), 
(1, 'A2', 2, 1, 1);
