DROP VIEW IF EXISTS v_booking_overview CASCADE;
DROP VIEW IF EXISTS v_trending_shows CASCADE;

CREATE OR REPLACE VIEW v_trending_shows AS
SELECT
    s.id,
    s.movie_name,
    s.description,
    s.start_time,
    s.duration,
    s.price,
    s.room_id,
    s.poster_url,
    s.trailer_id,
    s.views,
    s.bookings_count,
    s.admin_boost,
    s.is_hot,
    (s.views * 0.3 + s.bookings_count * 0.7 + s.admin_boost) AS trending_score
FROM shows s;

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
