const express = require('express');
const router = express.Router();
const staffController = require('./staff.controller');
const authMiddleware = require('../gateway/middlewares/auth.middleware');
const authorize = require('../gateway/middlewares/role.middleware');

router.get(
  '/tickets/:ticketCode',
  authMiddleware,
  authorize(['admin', 'staff']),
  staffController.getTicketForCheckIn
);
router.post('/check-in', authMiddleware, authorize(['admin', 'staff']), staffController.checkInTicket);
router.post(
  '/check-in/:ticketCode',
  authMiddleware,
  authorize(['admin', 'staff']),
  staffController.checkInTicket
);

module.exports = router;
