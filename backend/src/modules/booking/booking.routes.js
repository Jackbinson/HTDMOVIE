const express = require('express');
const router = express.Router();
const bookingController = require('./booking.controller');
const authMiddleware = require('../gateway/middlewares/auth.middleware');

router.post('/hold', authMiddleware, bookingController.holdSeats);
router.get('/:bookingId', authMiddleware, bookingController.getBookingById);

module.exports = router;
