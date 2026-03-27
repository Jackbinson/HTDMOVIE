const pool = require('../../config/database');

const seatController = {
  getSeatsByShowId: async (req, res) => {
    const { showId } = req.params;

    try {
      // Chúng ta sắp xếp theo seat_code để Frontend dễ xử lý mảng
      const result = await pool.query(
        `SELECT id, show_id, seat_code, status, holder_id, held_expires_at 
         FROM show_seats 
         WHERE show_id = $1 
         ORDER BY seat_code ASC`, 
        [showId]
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Lỗi lấy sơ đồ ghế:", error.message);
      res.status(500).json({ success: false, message: "Không thể tải sơ đồ ghế!" });
    }
  },

  // 2. Kiểm tra chi tiết 1 ghế (Nếu cần hiển thị popup thông tin ghế)
  getSeatDetail: async (req, res) => {
    const { seatId } = req.params;
    try {
      const result = await pool.query('SELECT * FROM show_seats WHERE id = $1', [seatId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy ghế này" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = seatController;