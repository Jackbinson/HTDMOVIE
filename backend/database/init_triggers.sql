-- ==============================================================
-- PHAN 1: TU DONG DIEN FULL NAME CHO USERS
-- ==============================================================

CREATE OR REPLACE FUNCTION fn_fill_fullname_from_username()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        IF NEW.full_name IS NULL OR TRIM(NEW.full_name) = '' THEN
            NEW.full_name := NEW.username;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fill_fullname_before_save ON users;
CREATE TRIGGER trg_fill_fullname_before_save
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION fn_fill_fullname_from_username();


-- ==============================================================
-- PHAN 2: KHONG CAP NHAT rooms.total_seats TU show_seats
-- show_seats la so do ghe theo tung suat chieu, khong phai so ghe vat ly cua phong.
-- Neu dong bo theo show_seats thi total_seats cua room se bi sai dan theo thoi gian.
-- ==============================================================

DROP TRIGGER IF EXISTS trg_update_room_seats ON show_seats;
DROP FUNCTION IF EXISTS update_room_seat_count();


-- ==============================================================
-- PHAN 3: TU DONG GIAI PHONG GHE HET HAN
-- ==============================================================

CREATE OR REPLACE FUNCTION check_seat_expiry()
RETURNS TRIGGER AS $$
BEGIN
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
