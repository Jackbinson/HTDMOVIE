// src/modules/booking/booking.routes.js
const express = require('express');
const router = express.Router();
const bookingController = require('./booking.controller');
const authMiddleware = require('../gateway/middlewares/auth.middleware');
// 1. Route giữ ghế (POST /api/bookings/hold)
router.post('/hold', authMiddleware, bookingController.holdSeats);

module.exports = router;