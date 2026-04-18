// src/server.js
const express = require('express');
const cors = require('cors');
const path = require('path'); // Thêm thư viện path để xử lý ảnh
require('dotenv').config();
require('./cron/scheduler');

const app = express();
const port = process.env.PORT || 3000;

const accessLogger = require('./modules/gateway/middlewares/accessLogger.middleware');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// IMPORT MIDDLEWARES
const errorMiddleware = require('./modules/gateway/middlewares/error.middleware');

// Sử dụng Access Logger Middleware
app.use(accessLogger());

// Middleware cơ bản
app.use(cors());
app.use(express.json()); // Đọc JSON body
app.use(express.urlencoded({ extended: true })); // Đọc Form data (quan trọng cho upload file)

// 👇 2. CẤU HÌNH THƯ MỤC ẢNH (Để xem được ảnh trên trình duyệt)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- ROUTES ---
app.use('/api/movies', require('./modules/movies/movies.routes'));

const bookingRoutes = require('./modules/booking/booking.routes');
const paymentRoutes = require('./modules/payment/payment.routes');
const authRoutes = require('./modules/auth/auth.routes'); 
const adminRoutes = require('./modules/admin/admin.routes');
const staffRoutes = require('./modules/staff/staff.router');
const recommendRouter = require('./modules/recommend/recommend.router');
const seatRoutes = require('./modules/seats/seats.router');
const userRoutes = require('./modules/user/user.routes');
const managementAiRoutes = require('./modules/management-ai/management-ai.routes');
app.use('/api/auth', authRoutes); 
app.use('/api/bookings', bookingRoutes); 
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/management-ai', managementAiRoutes);
app.use('/api', recommendRouter); 
// Test Route
app.get('/', (req, res) => {
  res.send('Ticket Booking API is running...');
});

app.all(/(.*)/, (req, res, next) => { 
  const err = new Error(`Không tìm thấy đường dẫn: ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
});


app.use(errorMiddleware); 

// --- START SERVER ---
app.listen(port, () => {
  console.log(`🚀 Server đang chạy tại port ${port}`);
});
