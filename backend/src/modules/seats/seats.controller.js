const pool = require('../../config/database');

const buildSeatCodes = totalSeats => {
  const safeTotal = Math.max(Number(totalSeats) || 0, 0);
  const seatsPerRow = 10;
  const seatCodes = [];

  for (let index = 0; index < safeTotal; index += 1) {
    const row = String.fromCharCode(65 + Math.floor(index / seatsPerRow));
    const col = (index % seatsPerRow) + 1;
    seatCodes.push(`${row}${col}`);
  }

  return seatCodes;
};

const ensureSeatMapForShow = async showId => {
  const showResult = await pool.query(
    `SELECT s.id, s.room_id, r.total_seats
     FROM shows s
     JOIN rooms r ON r.id = s.room_id
     WHERE s.id = $1`,
    [showId]
  );

  const show = showResult.rows[0];
  if (!show) {
    return null;
  }

  const expectedSeatCodes = buildSeatCodes(show.total_seats);

  if (expectedSeatCodes.length === 0) {
    return show;
  }

  const existingSeatsResult = await pool.query(
    'SELECT seat_code FROM show_seats WHERE show_id = $1',
    [showId]
  );

  const existingSeatCodes = new Set(existingSeatsResult.rows.map(row => row.seat_code));
  const missingSeatCodes = expectedSeatCodes.filter(code => !existingSeatCodes.has(code));

  if (missingSeatCodes.length > 0) {
    for (const seatCode of missingSeatCodes) {
      await pool.query(
        `INSERT INTO show_seats (show_id, seat_code, status)
         VALUES ($1, $2, 0)
         ON CONFLICT (show_id, seat_code) DO NOTHING`,
        [showId, seatCode]
      );
    }
  }

  return show;
};

const seatController = {
  getSeatsByShowId: async (req, res) => {
    const { showId } = req.params;

    try {
      const show = await ensureSeatMapForShow(showId);

      if (!show) {
        return res.status(404).json({
          success: false,
          message: 'Khong tim thay suat chieu.'
        });
      }

      const result = await pool.query(
        `SELECT id, show_id, seat_code, status, holder_id, held_expires_at
         FROM show_seats
         WHERE show_id = $1
         ORDER BY seat_code ASC`,
        [showId]
      );

      return res.json(result.rows);
    } catch (error) {
      console.error('Loi lay so do ghe:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Khong the tai so do ghe!'
      });
    }
  },

  getSeatDetail: async (req, res) => {
    const { seatId } = req.params;

    try {
      const result = await pool.query('SELECT * FROM show_seats WHERE id = $1', [seatId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Khong tim thay ghe nay' });
      }

      return res.json(result.rows[0]);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
};

module.exports = seatController;
