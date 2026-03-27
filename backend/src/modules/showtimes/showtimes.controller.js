// src/modules/showtimes/showtimes.controller.js
const pool = require('../../config/database');

// API: Tạo suất chiếu mới
exports.createShowtime = async (req, res, next) => {
  try {
    const { movie_id, room_name, start_time, price } = req.body;

    // 1. Tìm phim để lấy thời lượng (duration)
    const movieResult = await pool.query('SELECT duration FROM movies WHERE id = $1', [movie_id]);
    
    if (movieResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phim này!' });
    }

    const durationMinutes = movieResult.rows[0].duration;

    // 2. Tính giờ kết thúc (End Time) = Giờ bắt đầu + Thời lượng phim
    const startDate = new Date(start_time);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000); 

    // 3. Lưu vào Database
    const query = `
      INSERT INTO showtimes (movie_id, room_name, start_time, end_time, price)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    
    const values = [movie_id, room_name, start_time, endDate, price || 75000];
    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Tạo suất chiếu thành công!',
      data: result.rows[0]
    });

  } catch (err) {
    next(err);
  }
};