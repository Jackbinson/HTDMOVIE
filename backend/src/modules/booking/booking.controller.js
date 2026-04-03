// src/modules/booking/booking.controller.js
const bookingRepo = require('./booking.repository');

const bookingController = {
  
  // 1. API: Giữ ghế (POST /api/bookings/hold)
  holdSeats: async (req, res) => {
    try {
      const { showId, seatCodes } = req.body;
      
      const userId = req.user?.id; 
      console.log("Đang giữ ghế cho User ID:", userId);

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để đặt vé!' });
      }
      if (!showId || !seatCodes || !Array.isArray(seatCodes) || seatCodes.length === 0) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn suất chiếu và ghế hợp lệ!' });
      }

      // 3. Gọi xuống DB và Redis hứng kết quả
      const result = await bookingRepo.holdSeats(userId, showId, seatCodes);

      // 4. Trả về thành công
      return res.status(201).json({
        success: true,
        message: 'Giữ ghế thành công! Vui lòng thanh toán trong 10 phút.',
        data: { 
          bookingId: result.booking_info.new_booking_id, 
          totalAmount: result.booking_info.total_amount, 
          seatCodes: result.seats_locked,
          expiresIn: result.expires_in
        }
      });

    } catch (error) {
      console.error("Lỗi đặt vé:", error.message);
      return res.status(409).json({
        success: false,
        message: error.message 
      });
    }
  },

  // ==========================================
  // 2. API: Lấy danh sách ghế đang giữ (GET /api/bookings/held-seats/:showId)
  getHeldSeats: async (req, res) => {
    try {
      const { showId } = req.params;

      if (!showId) {
        return res.status(400).json({ success: false, message: "Thiếu ID suất chiếu" });
      }

      const heldSeats = await bookingRepo.getHeldSeats(showId);

      return res.status(200).json({
        success: true,
        data: heldSeats 
      });

    } catch (error) {
      console.error("Lỗi getHeldSeats controller:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ khi tải trạng thái ghế"
      });
    }
  },

  getBookingById: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const booking = await bookingRepo.getBookingById(bookingId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Khong tim thay booking.'
        });
      }

      const requesterId = req.user?.id;
      const requesterRole = req.user?.role;

      if (
        requesterRole !== 'admin' &&
        requesterRole !== 'staff' &&
        Number(booking.user_id) !== Number(requesterId)
      ) {
        return res.status(403).json({
          success: false,
          message: 'Ban khong co quyen xem booking nay.'
        });
      }

      return res.status(200).json({
        success: true,
        data: booking
      });
    } catch (error) {
      console.error('Loi getBookingById controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Loi may chu khi tai chi tiet booking.'
      });
    }
  }
};

module.exports = bookingController;
