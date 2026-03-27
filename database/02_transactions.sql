-- ==============================================================
-- FILE 2: TRANSACTIONS (ĐÃ SỬA LỖI & TỐI ƯU CHO NODEJS)
-- ==============================================================

-- 1. FUNCTION: GIỮ GHẾ (HOLD SEATS)
-- Đổi thành FUNCTION để dễ dàng trả về ID và Tổng tiền cho Backend
DROP FUNCTION IF EXISTS hold_seats_transaction;
CREATE OR REPLACE FUNCTION hold_seats_transaction(
    p_user_id INT,
    p_show_id INT,
    p_seat_codes TEXT[] 
)
RETURNS TABLE (
    new_booking_id INT,
    total_amount DECIMAL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_price DECIMAL(10, 2);
    v_unit_price DECIMAL(10, 2);
    v_booking_id INT;
    v_seat_count INT;
    v_valid_seats INT;
BEGIN
    -- Lấy giá vé từ bảng shows
    SELECT price INTO v_unit_price FROM shows WHERE id = p_show_id;
    IF v_unit_price IS NULL THEN RAISE EXCEPTION 'Suất chiếu không tồn tại!'; END IF;

    v_seat_count := array_length(p_seat_codes, 1);
    v_total_price := v_unit_price * v_seat_count;

    -- Kiểm tra ghế trống HOẶC ghế đã hết hạn giữ chỗ (để đè lên)
    -- Dùng FOR UPDATE để khóa dòng dữ liệu tránh tranh chấp
    SELECT COUNT(*) INTO v_valid_seats
    FROM show_seats
    WHERE show_id = p_show_id
      AND seat_code = ANY(p_seat_codes)
      AND (status = 0 OR (status = 1 AND held_expires_at < NOW()))
    FOR UPDATE;

    IF v_valid_seats != v_seat_count THEN
        RAISE EXCEPTION 'Conflict: Một số ghế bạn chọn đã bị người khác giữ!';
    END IF;

    -- Tạo đơn PENDING (SỬA LỖI: Đã thêm show_id)
    INSERT INTO bookings (user_id, show_id, total_amount, payment_status, created_at)
    VALUES (p_user_id, p_show_id, v_total_price, 'PENDING', NOW())
    RETURNING id INTO v_booking_id;

    -- Cập nhật trạng thái GIỮ (15 phút)
    UPDATE show_seats
    SET status = 1,
        booking_id = v_booking_id,
        holder_id = p_user_id,
        held_expires_at = NOW() + INTERVAL '15 minutes'
    WHERE show_id = p_show_id AND seat_code = ANY(p_seat_codes);

    -- Trả kết quả về cho Node.js
    RETURN QUERY SELECT v_booking_id, v_total_price;
END;
$$;

-- 2. PROCEDURE: XÁC NHẬN THANH TOÁN (Giữ nguyên)
CREATE OR REPLACE PROCEDURE confirm_booking_transaction(
    p_booking_id INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_status VARCHAR;
BEGIN
    SELECT payment_status INTO v_status FROM bookings WHERE id = p_booking_id FOR UPDATE;

    IF v_status IS NULL THEN RAISE EXCEPTION 'Đơn hàng không tồn tại!'; END IF;
    IF v_status = 'COMPLETED' THEN RETURN; END IF; 
    IF v_status = 'CANCELLED' THEN RAISE EXCEPTION 'Đơn đã hủy, không thể thanh toán!'; END IF;

    UPDATE bookings SET payment_status = 'COMPLETED' WHERE id = p_booking_id;

    UPDATE show_seats
    SET status = 2, held_expires_at = NULL
    WHERE booking_id = p_booking_id;
END;
$$;

-- 3. PROCEDURE: HỦY ĐƠN (Giữ nguyên)
CREATE OR REPLACE PROCEDURE cancel_booking_transaction(
    p_booking_id INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE bookings 
    SET payment_status = 'CANCELLED' 
    WHERE id = p_booking_id AND payment_status != 'CANCELLED';

    UPDATE show_seats
    SET status = 0, booking_id = NULL, holder_id = NULL, held_expires_at = NULL
    WHERE booking_id = p_booking_id;
END;
$$;

-- 4. PROCEDURE: DỌN DẸP GHẾ QUÁ HẠN (Giữ nguyên)
CREATE OR REPLACE PROCEDURE cleanup_expired_holds()
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE show_seats
    SET status = 0, booking_id = NULL, holder_id = NULL, held_expires_at = NULL
    WHERE status = 1 AND held_expires_at < NOW();
END;
$$;