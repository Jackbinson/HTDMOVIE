const { z } = require('zod');

const createMovieSchema = z.object({
  title: z.string().min(1, "Tên phim không được để trống"),
  
  description: z.string().min(1, "Mô tả không được để trống"),
  
  // Vì Postman gửi form-data là string, dùng z.coerce để tự động ép kiểu sang Number
  duration: z.coerce.number().min(1, "Thời lượng phải lớn hơn 0 phút"), 
  
  price: z.coerce.number().min(0, "Giá vé không được âm"),

  room_id: z.coerce.number().min(1, "Phòng chiếu không hợp lệ"),

  // Kiểm tra định dạng ngày giờ gửi lên
  start_time: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Thời gian bắt đầu không hợp lệ (YYYY-MM-DD HH:mm:ss)",
  }),
});

module.exports = { createMovieSchema };