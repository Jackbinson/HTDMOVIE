// src/modules/gateway/middlewares/accessLogger.middleware.js

// 1. Import Logger của chúng ta (Sửa đường dẫn cho đúng)
const logger = require('../../utils/logger');
// 2. Cấu hình các tham số môi trường
const SAMPLE_2XX = Number(process.env.LOG_SAMPLE_2XX ?? 0.1); 
const SAMPLE_4XX = Number(process.env.LOG_SAMPLE_4XX ?? 0.3); 
const SLOW_MS = Number(process.env.LOG_SLOW_MS ?? 1000);

// Hàm tính thời gian xử lý
function durationMs(req) {
  if (!req._startAtNs) return 0;
  const ns = process.hrtime.bigint() - req._startAtNs;
  return Number(ns) / 1000000; // Đổi sang mili giây
}

// Hàm kiểm tra API Health check (bỏ qua log cho đỡ rác)
function isHealth(req) {
  const u = req.originalUrl || req.url || "";
  return u === "/health" || u === "/ready";
}

// Hàm xác định các API quan trọng (luôn phải ghi log)
function isCritical(req) {
  const u = req.originalUrl || req.url || "";
  return u.startsWith("/auth") || u.startsWith("/payments") || u.startsWith("/admin");
}

// Hàm quyết định có ghi log hay không (Smart Sampling)
function shouldLog({ req, statusCode, dMs }) {
  if (isHealth(req) && statusCode < 400) return false;
  if (statusCode >= 500) return true; // Lỗi Server -> GHI
  if (typeof dMs === "number" && dMs >= SLOW_MS) return true; // Chậm -> GHI
  if (isCritical(req)) return true; // Quan trọng -> GHI
  if ([401, 403, 429].includes(statusCode)) return true; // Lỗi bảo mật -> GHI
  
  if (statusCode >= 400) return Math.random() < SAMPLE_4XX; // Lỗi client -> Ghi ngẫu nhiên
  return Math.random() < SAMPLE_2XX; // Thành công -> Ghi ngẫu nhiên
}

// 3. SỬA LỖI CHÍNH: Dùng module.exports thay vì export function
module.exports = function accessLogger() {
  return (req, res, next) => {
    // 4. BẮT BUỘC: Đánh dấu thời gian bắt đầu (Code gốc của bạn thiếu dòng này)
    req._startAtNs = process.hrtime.bigint();

    res.on("finish", () => {
      const statusCode = res.statusCode || 0;
      const dMs = durationMs(req);

      if (shouldLog({ req, statusCode, dMs })) {
        const logData = {
          event: "request_completed",
          method: req.method,
          url: req.originalUrl || req.url,
          status: statusCode,
          duration: `${dMs.toFixed(2)}ms`,
          contentLength: res.getHeader("content-length"),
          ip: req.ip || req.socket.remoteAddress
        };

        // 5. Sử dụng Winston Logger để ghi thay vì req.log (vì req.log chưa được cài đặt)
        const message = JSON.stringify(logData);
        
        if (statusCode >= 500) {
            logger.error(message);
        } else if (statusCode >= 400) {
            logger.warn(message);
        } else {
            logger.info(message);
        }
      }
    });

    next();
  };
};