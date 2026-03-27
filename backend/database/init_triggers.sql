-- ==============================================================
-- PHẦN 1: TỰ ĐỘNG ĐIỀN FULL NAME (BẢNG USERS)
-- Logic: Nếu full_name để trống, lấy username đắp vào.
-- ==============================================================

CREATE OR REPLACE FUNCTION auto_fill_fullname()
RETURNS TRIGGER AS $$ 
BEGIN 
    IF NEW.full_name IS NULL OR TRIM(NEW.full_name) = '' THEN 
        NEW.full_name := NEW.username; 
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_fill_fullname ON users;
CREATE TRIGGER trg_auto_fill_fullname
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION auto_fill_fullname();


-- ==============================================================
-- PHẦN 2: CẬP NHẬT TỔNG SỐ GHẾ TRONG PHÒNG (BẢNG SHOW_SEATS -> ROOMS)
-- Logic: Thêm ghế vật lý thì tăng total_seats, xóa thì giảm.
-- ==============================================================

CREATE OR REPLACE FUNCTION update_room_seat_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE rooms 
        SET total_seats = total_seats + 1
        WHERE id = (SELECT room_id FROM shows WHERE id = NEW.show_id);
        
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE rooms 
        SET total_seats = total_seats - 1
        WHERE id = (SELECT room_id FROM shows WHERE id = OLD.show_id);
    END IF;
    
    RETURN NULL; 
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_room_seats ON show_seats;
CREATE TRIGGER trg_update_room_seats
AFTER INSERT OR DELETE ON show_seats
FOR EACH ROW
EXECUTE FUNCTION update_room_seat_count();


-- ==============================================================
-- PHẦN 3: TỰ ĐỘNG GIẢI PHÓNG GHẾ HẾT HẠN (BẢNG SHOW_SEATS)
-- Logic: Khi update, nếu thời gian giữ chỗ đã qua, reset status về 0.
-- ==============================================================

CREATE OR REPLACE FUNCTION check_seat_expiry()
RETURNS TRIGGER AS $$
BEGIN
    -- so sánh trạng thái trạng thái 'Giữ chỗ' (1) và đã quá thời gian held_expires_at
    IF NEW.status = 1 AND NEW.held_expires_at < NOW() THEN
        NEW.status := 0;
        NEW.holder_id := NULL;
        NEW.held_expires_at := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_seat_expiry ON show_seats;
CREATE TRIGGER trg_check_seat_expiry
BEFORE UPDATE ON show_seats
FOR EACH ROW
EXECUTE FUNCTION check_seat_expiry();