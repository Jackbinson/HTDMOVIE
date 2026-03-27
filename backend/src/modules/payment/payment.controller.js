// src/modules/payment/payment.controller.js

// Import Repository của Booking (đường dẫn đi ngược ra ngoài 1 cấp)
const bookingRepo = require('../booking/booking.repository');

// 1. API TẠO MÃ QR
exports.createPaymentQR = async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    // Config ngân hàng (BIDV)
    const BANK_ID = 'BIDV';       
    const ACCOUNT_NO = '8861977226'; 

    const booking = await bookingRepo.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    }

    // Nội dung: PAY <ID>
    const description = `PAY ${bookingId}`; 
    const accountName = 'HTD MOVIE';

    const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact.png?amount=${booking.total_amount}&addInfo=${description}&accountName=${accountName}`;

    return res.status(200).json({
      message: 'Tạo mã QR thành công',
      data: {
        bookingId: booking.id,
        amount: booking.total_amount,
        qrCodeUrl: qrUrl,
        description: description
      }
    });
  } catch (error) {
    console.error("Lỗi tạo QR:", error.message);
    return res.status(500).json({ message: 'Lỗi tạo mã QR', error: error.message });
  }
};

// 2. WEBHOOK SEPAY (Chuyển từ Booking sang)
exports.handleSePayWebhook = async (req, res) => {
  try {
    const { transferType, transferAmount, content } = req.body;
    console.log("🔔 Webhook Payment:", JSON.stringify(req.body));

    if (transferType !== 'in') return res.json({ success: true });

    // Regex lấy mã đơn: PAY <số>
    const match = content.match(/PAY\s*(\d+)/i); 
    if (!match) return res.json({ success: true, message: 'No booking ID' });

    const bookingId = parseInt(match[1]);
    const booking = await bookingRepo.getBookingById(bookingId);
    
    if (!booking) return res.json({ success: true, message: 'Booking not found' });
    if (booking.payment_status === 'COMPLETED') return res.json({ success: true, message: 'Paid' });

    // Check tiền
    if (parseFloat(transferAmount) < parseFloat(booking.total_amount)) {
      return res.json({ success: true, message: 'Not enough money' });
    }

    // GỌI REPO ĐỂ CONFIRM
    await bookingRepo.confirmBooking(bookingId);
    console.log(`🚀 Thanh toán thành công đơn: ${bookingId}`);

    return res.json({ success: true });
  } catch (error) {
    console.error("Lỗi Webhook:", error.message);
    return res.json({ success: true });
  }
};