const pool = require('../../config/database');
const bookingRepo = require('../booking/booking.repository');
const { hasTicketIsUsedColumn } = require('../utils/ticketSchema');
const {
  decryptPaymentQrPayload,
  encryptPaymentQrPayload,
  isEncryptedPaymentQrPayload
} = require('../utils/paymentQrToken');

const BANK_ID = 'BIDV';
const ACCOUNT_NO = '8861977226';
const ACCOUNT_NAME = 'HTD MOVIE';

const resolveBookingIdFromTransferContent = content => {
  const normalizedContent = String(content || '').trim();

  if (!normalizedContent) {
    return null;
  }

  if (isEncryptedPaymentQrPayload(normalizedContent)) {
    return decryptPaymentQrPayload(normalizedContent);
  }

  const encryptedMatch = normalizedContent.match(/(HTDPAY\.V1\.[A-F0-9.]+)/i);
  if (encryptedMatch) {
    return decryptPaymentQrPayload(encryptedMatch[1]);
  }

  const legacyMatch = normalizedContent.match(/PAY\s*(\d+)/i);
  if (legacyMatch) {
    return parseInt(legacyMatch[1], 10);
  }

  return null;
};

const ensureBookingAccess = (booking, requester) => {
  const requesterId = requester?.id;
  const requesterRole = requester?.role;
  const ownerId = booking.user_id ?? booking.userId;

  return (
    requesterRole === 'admin' ||
    requesterRole === 'staff' ||
    Number(ownerId) === Number(requesterId)
  );
};

const getPaymentBillData = async bookingId => {
  const hasIsUsedColumn = await hasTicketIsUsedColumn();
  const bookingResult = await pool.query(
    `SELECT
       b.id AS booking_id,
       b.user_id,
       b.total_amount,
       b.payment_status,
       b.created_at,
       u.full_name,
       u.email,
       u.username,
       s.id AS show_id,
       s.movie_name,
       s.start_time,
       r.name AS room_name
     FROM bookings b
     JOIN users u ON u.id = b.user_id
     JOIN shows s ON s.id = b.show_id
     LEFT JOIN rooms r ON r.id = s.room_id
     WHERE b.id = $1`,
    [bookingId]
  );

  const booking = bookingResult.rows[0];
  if (!booking) {
    return null;
  }

  const seatResult = await pool.query(
    `SELECT seat_code, ticket_code, ${
      hasIsUsedColumn ? 'is_used' : 'FALSE AS is_used'
    }, created_at
     FROM tickets
     WHERE booking_id = $1
     ORDER BY seat_code ASC`,
    [bookingId]
  );

  let seats = seatResult.rows;

  if (seats.length === 0) {
    const reservedSeatResult = await pool.query(
      `SELECT seat_code
       FROM show_seats
       WHERE booking_id = $1
       ORDER BY seat_code ASC`,
      [bookingId]
    );

    seats = reservedSeatResult.rows.map(seat => ({
      seat_code: seat.seat_code,
      ticket_code: null,
      is_used: false,
      created_at: null
    }));
  }

  return {
    bookingId: booking.booking_id,
    userId: booking.user_id,
    customerName: booking.full_name || booking.username || 'Khach hang',
    customerEmail: booking.email,
    movieName: booking.movie_name,
    roomName: booking.room_name,
    startTime: booking.start_time,
    createdAt: booking.created_at,
    amount: booking.total_amount,
    status: booking.payment_status,
    seats,
    seatCodes: seats.map(seat => seat.seat_code),
    ticketCodes: seats.map(seat => seat.ticket_code).filter(Boolean),
    description: encryptPaymentQrPayload(booking.booking_id)
  };
};

const buildResponse = (bill, paymentMethod) => {
  const baseData = {
    ...bill,
    paymentMethod,
    paymentMethodLabel: paymentMethod === 'ONLINE' ? 'Thanh toan truc tuyen' : 'Thanh toan tai quay'
  };

  if (paymentMethod === 'ONLINE') {
    const qrCodeUrl =
      `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact.png` +
      `?amount=${bill.amount}&addInfo=${encodeURIComponent(bill.description)}` +
      `&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

    return {
      ...baseData,
      bankId: BANK_ID,
      accountNo: ACCOUNT_NO,
      accountName: ACCOUNT_NAME,
      qrCodeUrl,
      note: 'Quet QR va chuyen khoan dung noi dung de he thong tu dong xac nhan.'
    };
  }

  return {
    ...baseData,
    note: 'Vui long mang ma booking hoac bill nay den quay de thanh toan va nhan ve.'
  };
};

exports.createPaymentQR = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const bill = await getPaymentBillData(bookingId);

    if (!bill) {
      return res.status(404).json({ message: 'Don hang khong ton tai' });
    }

    if (!ensureBookingAccess(bill, req.user)) {
      return res.status(403).json({ message: 'Ban khong co quyen thanh toan don hang nay' });
    }

    return res.status(200).json({
      message: 'Tao ma QR thanh cong',
      data: buildResponse(bill, 'ONLINE')
    });
  } catch (error) {
    console.error('Loi tao QR:', error.message);
    return res.status(500).json({ message: 'Loi tao ma QR', error: error.message });
  }
};

exports.createCounterBill = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const bill = await getPaymentBillData(bookingId);

    if (!bill) {
      return res.status(404).json({ message: 'Don hang khong ton tai' });
    }

    if (!ensureBookingAccess(bill, req.user)) {
      return res.status(403).json({ message: 'Ban khong co quyen xem bill nay' });
    }

    return res.status(200).json({
      message: 'Tao bill thanh toan tai quay thanh cong',
      data: buildResponse(bill, 'COUNTER')
    });
  } catch (error) {
    console.error('Loi tao bill tai quay:', error.message);
    return res.status(500).json({ message: 'Loi tao bill tai quay', error: error.message });
  }
};

exports.getPaymentBill = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const paymentMethod = req.query.method === 'COUNTER' ? 'COUNTER' : 'ONLINE';
    const bill = await getPaymentBillData(bookingId);

    if (!bill) {
      return res.status(404).json({ message: 'Don hang khong ton tai' });
    }

    if (!ensureBookingAccess(bill, req.user)) {
      return res.status(403).json({ message: 'Ban khong co quyen xem bill nay' });
    }

    return res.status(200).json({
      message: 'Lay bill thanh cong',
      data: buildResponse(bill, paymentMethod)
    });
  } catch (error) {
    console.error('Loi lay bill:', error.message);
    return res.status(500).json({ message: 'Loi lay bill', error: error.message });
  }
};

exports.handleSePayWebhook = async (req, res) => {
  try {
    const { transferType, transferAmount, content } = req.body;
    console.log('Webhook Payment:', JSON.stringify(req.body));

    if (transferType !== 'in') return res.json({ success: true });

    const bookingId = resolveBookingIdFromTransferContent(content);
    if (!bookingId) return res.json({ success: true, message: 'No booking ID' });

    const booking = await bookingRepo.getBookingById(bookingId);

    if (!booking) return res.json({ success: true, message: 'Booking not found' });
    if (booking.payment_status === 'COMPLETED') {
      return res.json({ success: true, message: 'Paid' });
    }

    if (parseFloat(transferAmount) < parseFloat(booking.total_amount)) {
      return res.json({ success: true, message: 'Not enough money' });
    }

    await bookingRepo.confirmBooking(bookingId);
    console.log(`Thanh toan thanh cong don: ${bookingId}`);

    return res.json({ success: true });
  } catch (error) {
    console.error('Loi Webhook:', error.message);
    return res.json({ success: true });
  }
};
