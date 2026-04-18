const pool = require('../../config/database');
const logger = require('../utils/logger');

const ensureRoomExists = async (roomId) => {
  const roomResult = await pool.query(
    'SELECT id, name, total_seats FROM rooms WHERE id = $1',
    [roomId]
  );

  return roomResult.rows[0] || null;
};

exports.createShow = async (req, res) => {
  try {
    const { movie_name, start_time, price, room_id } = req.body;
    const room = await ensureRoomExists(room_id);

    if (!room) {
      return res.status(400).json({
        success: false,
        message: `Phong chieu ID ${room_id} khong ton tai. Hien tai chi duoc chon cac phong co san trong he thong.`
      });
    }

    const result = await pool.query(
      'INSERT INTO shows (movie_name, start_time, price, room_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [movie_name, start_time, price, room_id]
    );

    logger.info(`Admin [${req.user.username}] da them phim moi: ${movie_name}`);
    res.json({ success: true, message: 'Them phim thanh cong!', data: result.rows[0] });
  } catch (err) {
    logger.error(`Loi them phim: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteShow = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM shows WHERE id = $1', [id]);

    logger.warn(`Admin [${req.user.username}] da XOA suat chieu ID: ${id}`);
    res.json({ success: true, message: 'Da xoa suat chieu!' });
  } catch (err) {
    logger.error(`Loi xoa phim ID ${req.params.id}: ${err.message}`);
    res.status(500).json({ message: 'Khong the xoa (co the da co nguoi dat ve)' });
  }
};

exports.getSalesReport = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT SUM(total_amount) as total_revenue, COUNT(id) as total_bookings
      FROM bookings WHERE payment_status = 'COMPLETED'
    `);

    res.json({ success: true, report: result.rows[0] });
  } catch (err) {
    logger.error(`Loi xem bao cao: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

exports.getLoyalCustomers = async (req, res) => {
  try {
    const query = `
      SELECT u.full_name, COUNT(b.id) as total_transactions, SUM(b.total_amount) as total_spent
      FROM users u JOIN bookings b ON u.id = b.user_id
      WHERE b.payment_status = 'COMPLETED'
      GROUP BY u.id ORDER BY total_transactions DESC LIMIT 10;
    `;
    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    logger.error(`Loi xem khach hang than thiet: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

exports.updateShow = async (req, res) => {
  try {
    const { id } = req.params;
    const { movie_name, start_time, price, room_id } = req.body;
    const room = await ensureRoomExists(room_id);

    if (!room) {
      return res.status(400).json({
        success: false,
        message: `Phong chieu ID ${room_id} khong ton tai. Ban can chon mot phong hop le trong bang rooms.`
      });
    }

    const result = await pool.query(
      'UPDATE shows SET movie_name=$1, start_time=$2, price=$3, room_id=$4 WHERE id=$5 RETURNING *',
      [movie_name, start_time, price, room_id, id]
    );

    logger.info(`Admin [${req.user.username}] da SUA phim ID ${id}. Ten moi: ${movie_name}`);
    res.json({ success: true, message: 'Cap nhat thanh cong!', data: result.rows[0] });
  } catch (err) {
    logger.error(`Loi cap nhat phim ID ${req.params.id}: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    logger.info(`User [${req.user.username}] (${req.user.role}) dang xem danh sach ve.`);

    const result = await pool.query(`
      SELECT b.id, u.full_name, b.total_amount, b.payment_status, b.created_at, b.id as booking_id
      FROM bookings b JOIN users u ON b.user_id = u.id ORDER BY b.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    logger.error(`Loi lay danh sach ve: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

exports.getBookingOverview = async (req, res) => {
  try {
    logger.info(`User [${req.user.username}] (${req.user.role}) dang xem booking overview.`);

    const result = await pool.query(`
      SELECT
        b.id AS booking_id,
        u.id AS user_id,
        u.username,
        u.full_name,
        u.email,
        s.id AS show_id,
        s.movie_name,
        s.start_time,
        s.price AS ticket_price,
        r.id AS room_id,
        r.name AS room_name,
        b.total_amount,
        b.payment_status,
        b.created_at
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN shows s ON b.show_id = s.id
      LEFT JOIN rooms r ON s.room_id = r.id
      ORDER BY created_at DESC, booking_id DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    logger.error(`Loi lay booking overview: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

exports.getRooms = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, total_seats FROM rooms ORDER BY id ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    logger.error(`Loi lay danh sach phong: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, email, full_name, role, created_at
      FROM users
      ORDER BY created_at DESC, id DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    logger.error(`Loi lay danh sach nguoi dung: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

exports.promoteUserToStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await pool.query(
      'SELECT id, username, email, full_name, role FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay nguoi dung can cap quyen.'
      });
    }

    const targetUser = userResult.rows[0];

    if (targetUser.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Khong the thay doi quyen cua tai khoan admin bang chuc nang nay.'
      });
    }

    if (targetUser.role === 'staff') {
      return res.status(400).json({
        success: false,
        message: 'Tai khoan nay da la nhan vien.'
      });
    }

    const updatedResult = await pool.query(
      `UPDATE users
       SET role = 'staff'
       WHERE id = $1
       RETURNING id, username, email, full_name, role, created_at`,
      [id]
    );

    logger.info(
      `Admin [${req.user.username}] da nang quyen user [${targetUser.username}] len staff.`
    );

    res.json({
      success: true,
      message: 'Da nang quyen nguoi dung thanh nhan vien.',
      data: updatedResult.rows[0]
    });
  } catch (err) {
    logger.error(`Loi nang quyen nguoi dung: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};
