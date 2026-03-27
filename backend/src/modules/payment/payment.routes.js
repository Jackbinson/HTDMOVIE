// src/modules/payment/payment.routes.js
const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller'); // Đảm bảo import đúng file

// Route tạo mã QR
router.post('/qr', paymentController.createPaymentQR);

// Route Webhook
router.post('/sepay-webhook', paymentController.handleSePayWebhook);

module.exports = router;