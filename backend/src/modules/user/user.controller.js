const pool = require('../../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const { hasTicketIsUsedColumn } = require('../utils/ticketSchema');

exports.createUser = async (req, res) => {
  try {
    const username = req.body?.username?.trim();
    const email = req.body?.email?.trim().toLowerCase();
    const password = req.body?.password;
    const fullName = req.body?.fullName?.trim() || null;
    const role = req.body?.role?.trim() || 'user';
    const allowedRoles = ['user', 'staff', 'admin'];

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui long nhap day du username, email va password.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mat khau phai co it nhat 6 ky tu.'
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role khong hop le.'
      });
    }

    const existingUserResult = await pool.query(
      `SELECT id, username, email
       FROM users
       WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)
       LIMIT 1`,
      [username, email]
    );

    if (existingUserResult.rows.length > 0) {
      const existingUser = existingUserResult.rows[0];
      const message =
        existingUser.username?.toLowerCase() === username.toLowerCase()
          ? 'Username nay da ton tai.'
          : 'Email nay da ton tai.';

      return res.status(409).json({
        success: false,
        message
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, full_name, role, created_at`,
      [username, email, passwordHash, fullName, role]
    );

    logger.info(
      `Admin [${req.user.username}] da tao user moi [${result.rows[0].username}] voi role [${result.rows[0].role}].`
    );

    return res.status(201).json({
      success: true,
      message: 'Tao tai khoan thanh cong.',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error(`Loi khi tao user moi: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Loi may chu khi tao user moi.'
    });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    const result = await pool.query(
      `SELECT id, username, email, full_name, role, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay thong tin nguoi dung.'
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error(`Loi lay thong tin user: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Loi may chu khi lay thong tin nguoi dung.'
    });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const hasUsername = Object.prototype.hasOwnProperty.call(req.body || {}, 'username');
    const hasEmail = Object.prototype.hasOwnProperty.call(req.body || {}, 'email');
    const hasFullName = Object.prototype.hasOwnProperty.call(req.body || {}, 'fullName');

    if (!hasUsername && !hasEmail && !hasFullName) {
      return res.status(400).json({
        success: false,
        message: 'Vui long cung cap it nhat mot truong can cap nhat.'
      });
    }

    const currentUserResult = await pool.query(
      `SELECT id, username, email, full_name, role, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (currentUserResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay nguoi dung can cap nhat.'
      });
    }

    const currentUser = currentUserResult.rows[0];
    const nextUsername = hasUsername ? req.body.username?.trim() : currentUser.username;
    const nextEmail = hasEmail ? req.body.email?.trim().toLowerCase() : currentUser.email;
    const nextFullName = hasFullName ? req.body.fullName?.trim() || null : currentUser.full_name;

    if (!nextUsername || !nextEmail) {
      return res.status(400).json({
        success: false,
        message: 'Username va email khong duoc de trong.'
      });
    }

    const duplicateResult = await pool.query(
      `SELECT id, username, email
       FROM users
       WHERE id <> $1 AND (LOWER(username) = LOWER($2) OR LOWER(email) = LOWER($3))
       LIMIT 1`,
      [userId, nextUsername, nextEmail]
    );

    if (duplicateResult.rows.length > 0) {
      const duplicateUser = duplicateResult.rows[0];
      const message =
        duplicateUser.username?.toLowerCase() === nextUsername.toLowerCase()
          ? 'Username nay da ton tai.'
          : 'Email nay da ton tai.';

      return res.status(409).json({
        success: false,
        message
      });
    }

    const updatedResult = await pool.query(
      `UPDATE users
       SET username = $1, email = $2, full_name = $3
       WHERE id = $4
       RETURNING id, username, email, full_name, role, created_at`,
      [nextUsername, nextEmail, nextFullName, userId]
    );

    logger.info(`User [${req.user.username}] da cap nhat thong tin ca nhan.`);

    return res.status(200).json({
      success: true,
      message: 'Cap nhat thong tin thanh cong.',
      data: updatedResult.rows[0]
    });
  } catch (error) {
    logger.error(`Loi cap nhat thong tin user: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Loi may chu khi cap nhat thong tin nguoi dung.'
    });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user?.id;
    const hasIsUsedColumn = await hasTicketIsUsedColumn();

    const result = await pool.query(
      `SELECT
         b.id AS booking_id,
         b.show_id,
         b.total_amount,
         b.payment_status,
         b.created_at,
         s.movie_name,
         s.start_time,
         s.price AS ticket_price,
         r.id AS room_id,
         r.name AS room_name,
         COUNT(t.id) AS total_tickets,
         COALESCE(STRING_AGG(t.seat_code, ', ' ORDER BY t.seat_code), '') AS seat_codes,
         COALESCE(
           JSON_AGG(
             JSON_BUILD_OBJECT(
               'ticket_code', t.ticket_code,
               'seat_code', t.seat_code,
               'is_used', ${hasIsUsedColumn ? 't.is_used' : 'FALSE'}
             )
             ORDER BY t.seat_code
           ) FILTER (WHERE t.id IS NOT NULL),
           '[]'::json
         ) AS tickets
       FROM bookings b
       JOIN shows s ON s.id = b.show_id
       LEFT JOIN rooms r ON r.id = s.room_id
       LEFT JOIN tickets t ON t.booking_id = b.id
       WHERE b.user_id = $1
       GROUP BY
         b.id,
         b.show_id,
         b.total_amount,
         b.payment_status,
         b.created_at,
         s.movie_name,
         s.start_time,
         s.price,
         r.id,
         r.name
       ORDER BY b.created_at DESC, b.id DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error(`Loi lay lich su booking cua user: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Loi may chu khi lay lich su booking.'
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, username, email, full_name, role, created_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay nguoi dung.'
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error(`Loi lay chi tiet user: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Loi may chu khi lay chi tiet nguoi dung.'
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await pool.query(
      `SELECT id, username, email, full_name, role, created_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay nguoi dung.'
      });
    }

    const targetUser = userResult.rows[0];

    if (Number(req.user?.id) === Number(id)) {
      return res.status(400).json({
        success: false,
        message: 'Khong the tu xoa chinh tai khoan dang dang nhap.'
      });
    }

    if (targetUser.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Khong the xoa tai khoan admin.'
      });
    }

    const bookingCheckResult = await pool.query(
      'SELECT id FROM bookings WHERE user_id = $1 LIMIT 1',
      [id]
    );

    if (bookingCheckResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Nguoi dung nay da co booking lien quan, khong the xoa.'
      });
    }

    const result = await pool.query(
      `DELETE FROM users
       WHERE id = $1
       RETURNING id, username, email, full_name, role, created_at`,
      [id]
    );

    logger.info(
      `Admin [${req.user.username}] da xoa user [${targetUser.username}] (ID: ${targetUser.id}).`
    );

    return res.status(200).json({
      success: true,
      message: 'Xoa nguoi dung thanh cong.',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error(`Loi xoa user: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Loi may chu khi xoa nguoi dung.'
    });
  }
};
