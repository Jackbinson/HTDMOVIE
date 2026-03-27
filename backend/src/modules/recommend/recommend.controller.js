const pool = require('../../config/database');

const recommendController = {
  getTrendingMovies: async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM v_trending_shows 
         ORDER BY trending_score DESC 
         LIMIT 10`
      );
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error("Lỗi AI Recommend:", error.message);
      res.status(500).json({ message: "Không thể tải gợi ý phim" });
    }
  },

  getHeroBanner: async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM shows ORDER BY admin_boost DESC LIMIT 1`
      );
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = recommendController;