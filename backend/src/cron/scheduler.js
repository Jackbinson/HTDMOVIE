const cron = require('node-cron');
const pool = require('../config/database');

console.log('[CRON] Scheduler loaded. Cleanup job will run every minute.');

const task = cron.schedule('* * * * *', async () => {
  console.log('[CRON] Scanning expired seat holds...');

  try {
    const result = await pool.query(`
      UPDATE show_seats
      SET status = 0, booking_id = NULL, holder_id = NULL, held_expires_at = NULL
      WHERE status = 1 AND held_expires_at < NOW()
      RETURNING id
    `);

    console.log(`[CRON] Cleanup completed. Released ${result.rowCount} expired seats.`);
  } catch (error) {
    console.error('[CRON] Cleanup failed:', error.message);
  }
});

module.exports = task;
