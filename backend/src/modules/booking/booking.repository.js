// src/modules/booking/booking.repository.js
const crypto = require('crypto');
const pool = require('../../config/database');
const redisClient = require('../../config/redis');
const { hasTicketIsUsedColumn } = require('../utils/ticketSchema');

const buildTicketCode = (bookingId, showId, seatCode) => {
  const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TKT-${bookingId}-${showId}-${seatCode}-${randomSuffix}`;
};

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
          throw new Error(`Rat tiec! Ghe ${seatCode} vua co nguoi nhanh tay hon chon mat roi.`);
        }
      }

      const query = 'SELECT * FROM hold_seats_transaction($1, $2, $3)';
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

  async confirmBooking(bookingId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('CALL confirm_booking_transaction($1)', [bookingId]);

      const existingTicketsResult = await client.query(
        'SELECT id FROM tickets WHERE booking_id = $1 LIMIT 1',
        [bookingId]
      );

      if (existingTicketsResult.rows.length === 0) {
        const seatsResult = await client.query(
          `SELECT ss.show_id, ss.seat_code, s.price
           FROM show_seats ss
           JOIN shows s ON s.id = ss.show_id
           WHERE ss.booking_id = $1 AND ss.status = 2
           ORDER BY ss.seat_code ASC`,
          [bookingId]
        );

        for (const seat of seatsResult.rows) {
          const ticketCode = buildTicketCode(bookingId, seat.show_id, seat.seat_code);
          await client.query(
            `INSERT INTO tickets (booking_id, show_id, seat_code, ticket_code, price_at_purchase)
             VALUES ($1, $2, $3, $4, $5)`,
            [bookingId, seat.show_id, seat.seat_code, ticketCode, seat.price]
          );
        }
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getBookingById(bookingId) {
    const bookingResult = await pool.query(
      'SELECT * FROM bookings WHERE id = $1',
      [bookingId]
    );
    const booking = bookingResult.rows[0];

    if (!booking) {
      return null;
    }

    const hasIsUsedColumn = await hasTicketIsUsedColumn();

    const ticketsResult = await pool.query(
      `SELECT id, show_id, seat_code, ticket_code, ${
        hasIsUsedColumn ? 'is_used' : 'FALSE AS is_used'
      }, price_at_purchase, created_at
       FROM tickets
       WHERE booking_id = $1
       ORDER BY seat_code ASC`,
      [bookingId]
    );

    return {
      ...booking,
      tickets: ticketsResult.rows
    };
  }

  /**
   * Quet Redis de xem suat chieu nay dang co nhung ghe nao bi nguoi khac giu
   * @param {number} showId
   */
  async getHeldSeats(showId) {
    try {
      const pattern = `seat_hold:${showId}:*`;
      const keys = await redisClient.keys(pattern);

      if (!keys || keys.length === 0) {
        return [];
      }

      return keys.map(key => key.split(':')[2]);
    } catch (error) {
      console.error('Loi khi quet Redis lay ghe held:', error);
      throw new Error('Khong the lay danh sach ghe dang giu');
    }
  }
}

module.exports = new BookingRepository();
