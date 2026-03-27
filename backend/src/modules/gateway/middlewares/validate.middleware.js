// src/modules/gateway/middlewares/validate.middleware.js
const fs = require('fs');

// Hàm helper tạo lỗi
const createError = (message, details) => {
  const err = new Error(message);
  err.statusCode = 400;
  err.details = details;
  return err;
};

const validate = (schema, source = "body") => (req, res, next) => {
  // 1. Validate dữ liệu
  const result = schema.safeParse(req[source]);
  
  // 2. Nếu có lỗi validation
  if (!result.success) {
    
    // 👇 SỬA LỖI TẠI ĐÂY: Thêm chữ Sync vào cuối hàm unlink
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path); // ✅ ĐÚNG: unlinkSync không cần callback
        console.log(`🗑️ Đã xóa ảnh rác: ${req.file.path}`);
      } catch (err) {
        console.error("⚠️ Lỗi khi xóa file:", err.message);
      }
    }

    // Format lại lỗi trả về
    const details = result.error.issues.map((i) => ({
      field: i.path.join("."),
      issue: i.message,
    }));
    
    // Trả về lỗi
    return next(createError("Dữ liệu không hợp lệ", details));
  }

  // 3. Nếu OK (Không lỗi)
  if (!req.validated) {
    req.validated = {};
  }
  req.validated[source] = result.data;
  
  next();
};

module.exports = validate;