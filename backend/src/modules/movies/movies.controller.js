const pool = require('../../config/database'); 
const logger = require('../utils/logger'); 

// 1. Lấy danh sách phim 
exports.getMovies = async (req, res) => {
    try {
        const query = `
            SELECT 
                id, 
                movie_name AS title, 
                description, 
                start_time, 
                duration, 
                price, 
                room_id, 
                poster_url 
            FROM shows 
            ORDER BY start_time ASC
        `;
        const result = await pool.query(query); 
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        logger.error(`Lỗi lấy danh sách phim: ${error.message}`);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách phim' });
    }
};

// 2. Thêm phim mới 
exports.createMovie = async (req, res) => {
  try {
    const { title, description, price, start_time, duration, room_id } = req.body;
    const posterUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const query = `
      INSERT INTO shows (movie_name, description, price, start_time, duration, room_id, poster_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, movie_name AS title, description, start_time, duration, price, room_id, poster_url
    `;
    const values = [title, description, price, start_time, duration, room_id, posterUrl];
    
    const newMovie = await pool.query(query, values);
    
    const adminName = req.user ? req.user.username : 'Admin';
    logger.info(`Admin ${adminName} đã thêm phim: ${title}`);
    
    res.status(201).json({ success: true, data: newMovie.rows[0] });

  } catch (err) {
    logger.error(`Lỗi thêm phim: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Cập nhật riêng Poster
exports.updateMoviePoster = async (req, res) => {
  try {
    const movieId = req.params.id;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng đính kèm file ảnh!' });
    }

    const newPosterUrl = `/uploads/${req.file.filename}`;

    const query = `
        UPDATE shows 
        SET poster_url = $1 
        WHERE id = $2 
        RETURNING id, movie_name AS title, description, start_time, duration, price, room_id, poster_url
    `;
    const result = await pool.query(query, [newPosterUrl, movieId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phim!' });
    }

    res.json({ success: true, message: 'Cập nhật ảnh thành công!', data: result.rows[0] });
  } catch (err) {
    logger.error(`Lỗi cập nhật ảnh phim: ${err.message}`);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật ảnh' });
  }
};
// Lấy chi tiết 1 bộ phim theo ID 
exports.getMovieById = async (req, res) => {
  try {
    const movieId = req.params.id;
    const query = `
      SELECT 
          id,
          movie_name AS title,
          description,
          start_time,
          duration,
          price,
          room_id,
          poster_url
      FROM shows
      WHERE id = $1
    `;
    const result = await pool.query(query,[movieId]);
    if (result.rows.length === 0 ) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bộ phim này!'
      });
    }
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) { 
    logger.error(`Lỗi lấy chi tiết phim: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết phim'
    });
  }
}