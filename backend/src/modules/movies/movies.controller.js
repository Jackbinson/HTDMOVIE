const pool = require('../../config/database'); 
const logger = require('../utils/logger'); 

const ensureRoomExists = async roomId => {
  const result = await pool.query(
    'SELECT id, name, total_seats FROM rooms WHERE id = $1',
    [roomId]
  );

  return result.rows[0] || null;
};

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
    const payload = req.validated?.body || req.body;
    const { title, description, price, start_time, duration, room_id } = payload;
    const posterUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const room = await ensureRoomExists(room_id);

    if (!room) {
      return res.status(400).json({
        success: false,
        message: `Phong chieu ID ${room_id} khong ton tai. Vui long chon mot phong hop le.`
      });
    }

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

exports.updateMovie = async (req, res) => {
  try {
    const movieId = req.params.id;
    const payload = req.validated?.body || req.body;
    const { title, description, price, start_time, duration, room_id } = payload;
    const room = await ensureRoomExists(room_id);

    if (!room) {
      return res.status(400).json({
        success: false,
        message: `Phong chieu ID ${room_id} khong ton tai. Vui long chon mot phong hop le.`
      });
    }

    const currentMovieResult = await pool.query(
      'SELECT id, poster_url FROM shows WHERE id = $1',
      [movieId]
    );

    if (currentMovieResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay phim can cap nhat.'
      });
    }

    const nextPosterUrl = req.file
      ? `/uploads/${req.file.filename}`
      : currentMovieResult.rows[0].poster_url;

    const query = `
      UPDATE shows
      SET
        movie_name = $1,
        description = $2,
        price = $3,
        start_time = $4,
        duration = $5,
        room_id = $6,
        poster_url = $7
      WHERE id = $8
      RETURNING id, movie_name AS title, description, start_time, duration, price, room_id, poster_url
    `;

    const result = await pool.query(query, [
      title,
      description,
      price,
      start_time,
      duration,
      room_id,
      nextPosterUrl,
      movieId
    ]);

    logger.info(`Admin ${req.user?.username || 'Admin'} da cap nhat phim ID ${movieId}: ${title}`);
    res.json({
      success: true,
      message: 'Cap nhat phim thanh cong!',
      data: result.rows[0]
    });
  } catch (err) {
    logger.error(`Loi cap nhat phim: ${err.message}`);
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
