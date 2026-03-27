// src/modules/booking/booking.repository.js
const pool = require('../../config/database');
const redisClient = require('../../config/redis');

class BookingRepository {
  /**
   * @param {number} userId 
   * @param {number} showId 
   * @param {Array} seatCodes 
   */
  async holdSeats(userId, showId, seatCodes) {
    const holdDuration = 600; 
    const lockedSeats = [];  

    try {
      for (const seatCode of seatCodes) {
        const key = `seat_hold:${showId}:${seatCode}`;
        const isLocked = await redisClient.set(
          key,
          userId.toString(),
          'EX',
          holdDuration,
          'NX'
        );

        if (isLocked) {
          lockedSeats.push(key); 
        } else {
          throw new Error(`Rất tiếc! Ghế ${seatCode} vừa có người nhanh tay hơn chọn mất rồi.`);
        }
      }
      
      const query = `SELECT * FROM hold_seats_transaction($1, $2, $3)`;
      const result = await pool.query(query, [userId, showId, seatCodes]);
      
      return {
        booking_info: result.rows[0],
        expires_in: holdDuration,
        seats_locked: seatCodes
      };

    } catch (error) {
      if (lockedSeats.length > 0) {
        await redisClient.del(...lockedSeats);
      }
      throw new Error(error.message);
    }
  }

  // 2. Hàm xác nhận thanh toán 
  async confirmBooking(bookingId) {
    const query = `CALL confirm_booking_transaction($1)`;
    await pool.query(query, [bookingId]);
    return true;
  }

  // 3. Hàm lấy chi tiết Booking
  async getBookingById(bookingId) {
    const query = `SELECT * FROM bookings WHERE id = $1`;
    const result = await pool.query(query, [bookingId]);
    return result.rows[0];
  }

  /**
   * Quét Redis để xem suất chiếu này đang có những ghế nào bị người khác giữ
   * @param {number} showId 
   */
  async getHeldSeats(showId) {
    try {
      const pattern = `seat_hold:${showId}:*`;
      const keys = await redisClient.keys(pattern);

      if (!keys || keys.length === 0) {
        return []; 
      }

      const heldSeats = keys.map(key => key.split(':')[2]);

      return heldSeats;
    } catch (error) {
      console.error("Lỗi khi quét Redis lấy ghế held:", error);
      throw new Error("Không thể lấy danh sách ghế đang giữ");
    }
  }
}

module.exports = new BookingRepository();
