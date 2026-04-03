const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const authMiddleware = require('../gateway/middlewares/auth.middleware');

router.post('/qr', authMiddleware, paymentController.createPaymentQR);
router.post('/counter-bill', authMiddleware, paymentController.createCounterBill);
router.get('/bill/:bookingId', authMiddleware, paymentController.getPaymentBill);
router.post('/sepay-webhook', paymentController.handleSePayWebhook);

module.exports = router;
