const pool = require('../../config/database');
const logger = require('../utils/logger');
const { hasTicketIsUsedColumn } = require('../utils/ticketSchema');
const {
  decryptTicketQrPayload,
  isEncryptedTicketQrPayload
} = require('../utils/ticketQrToken');

const getTicketCodeFromRequest = req =>
  req.body?.ticketCode?.trim() ||
  req.params?.ticketCode?.trim() ||
  req.query?.ticketCode?.trim() ||
  '';

const resolveTicketCode = ticketCode => {
  if (!isEncryptedTicketQrPayload(ticketCode)) {
    return ticketCode;
  }

  return decryptTicketQrPayload(ticketCode) || '';
};

const getTicketByCode = async ticketCode => {
  const hasIsUsedColumn = await hasTicketIsUsedColumn();
  const ticketDetailQuery = `
    SELECT
      t.id,
      t.ticket_code,
      t.seat_code,
      ${hasIsUsedColumn ? 't.is_used' : 'FALSE AS is_used'},
      t.booking_id,
      t.show_id,
      t.price_at_purchase,
      b.payment_status,
      b.user_id,
      u.full_name,
      u.email,
      s.movie_name,
      s.start_time,
      r.name AS room_name
    FROM tickets t
    JOIN bookings b ON b.id = t.booking_id
    JOIN users u ON u.id = b.user_id
    JOIN shows s ON s.id = t.show_id
    LEFT JOIN rooms r ON r.id = s.room_id
    WHERE t.ticket_code = $1
  `;
  const result = await pool.query(ticketDetailQuery, [ticketCode]);
  return result.rows[0] || null;
};

const formatTicketData = ticket => ({
  id: ticket.id,
  ticket_code: ticket.ticket_code,
  seat_code: ticket.seat_code,
  is_used: ticket.is_used,
  booking_id: ticket.booking_id,
  show_id: ticket.show_id,
  price_at_purchase: ticket.price_at_purchase,
  payment_status: ticket.payment_status,
  user_id: ticket.user_id,
  full_name: ticket.full_name,
  email: ticket.email,
  movie_name: ticket.movie_name,
  start_time: ticket.start_time,
  room_name: ticket.room_name
});

exports.getTicketForCheckIn = async (req, res) => {
  try {
    const ticketCode = resolveTicketCode(getTicketCodeFromRequest(req));

    if (!ticketCode) {
      return res.status(400).json({
        success: false,
        message: 'Vui long cung cap ticketCode de tra cuu ve.'
      });
    }

    const ticket = await getTicketByCode(ticketCode);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay ve voi ma nay.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lay thong tin ve thanh cong.',
      data: formatTicketData(ticket)
    });
  } catch (error) {
    logger.error(`Loi lay thong tin ve check-in: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Loi may chu khi lay thong tin ve.'
    });
  }
};

exports.checkInTicket = async (req, res) => {
  try {
    const hasIsUsedColumn = await hasTicketIsUsedColumn();
    const ticketCode = resolveTicketCode(getTicketCodeFromRequest(req));

    if (!ticketCode) {
      return res.status(400).json({
        success: false,
        message: 'Vui long cung cap ticketCode de check-in.'
      });
    }

    const ticket = await getTicketByCode(ticketCode);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay ve voi ma nay.'
      });
    }

    if (ticket.payment_status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Ve nay chua thanh toan thanh cong, khong the check-in.',
        data: formatTicketData(ticket)
      });
    }

    if (ticket.is_used) {
      return res.status(409).json({
        success: false,
        message: 'Ve nay da duoc check-in truoc do.',
        data: formatTicketData(ticket)
      });
    }

    if (!hasIsUsedColumn) {
      return res.status(500).json({
        success: false,
        message: 'Database chua co cot is_used trong bang tickets. Vui long cap nhat schema truoc khi check-in.'
      });
    }

    await pool.query('UPDATE tickets SET is_used = TRUE WHERE id = $1', [ticket.id]);

    logger.info(
      `User [${req.user.username}] (${req.user.role}) da check-in ticket [${ticket.ticket_code}] cho booking [${ticket.booking_id}].`
    );

    return res.status(200).json({
      success: true,
      message: 'Check-in thanh cong.',
      data: {
        ...formatTicketData(ticket),
        is_used: true,
        checked_in_by: req.user.username
      }
    });
  } catch (error) {
    logger.error(`Loi check-in ticket: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Loi may chu khi check-in ve.'
    });
  }
};
