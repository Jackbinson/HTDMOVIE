const cron = require('node-cron');
const pool = require('../config/database');
const redisClient = require('../config/redis');

console.log('[CRON] Scheduler loaded. Cleanup job will run every minute.');

const task = cron.schedule('* * * * *', async () => {
  console.log('[CRON] Scanning expired seat holds...');

  try {
    const result = await pool.query(`
      UPDATE show_seats
      SET status = 0, booking_id = NULL, holder_id = NULL, held_expires_at = NULL
      WHERE status = 1 AND held_expires_at < NOW()
      RETURNING booking_id, show_id, seat_code
    `);

    if (result.rowCount > 0) {
      const bookingIds = [...new Set(result.rows.map(row => row.booking_id).filter(Boolean))];
      const redisKeys = result.rows.map(row => `seat_hold:${row.show_id}:${row.seat_code}`);

      if (bookingIds.length > 0) {
        await pool.query(
          `UPDATE bookings
           SET payment_status = 'CANCELLED'
           WHERE id = ANY($1)
             AND payment_status IN ('PENDING', 'FAILED')`,
          [bookingIds]
        );
      }

      if (redisKeys.length > 0) {
        await redisClient.del(...redisKeys);
      }
    }

    console.log(`[CRON] Cleanup completed. Released ${result.rowCount} expired seats.`);
  } catch (error) {
    console.error('[CRON] Cleanup failed:', error.message);
  }
});

module.exports = task;
