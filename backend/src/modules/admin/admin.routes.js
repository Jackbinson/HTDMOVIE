const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const authMiddleware = require('../gateway/middlewares/auth.middleware');
const authorize = require('../gateway/middlewares/role.middleware');

router.post('/shows', authMiddleware, authorize(['admin']), adminController.createShow);
router.put('/shows/:id', authMiddleware, authorize(['admin']), adminController.updateShow);
router.delete('/shows/:id', authMiddleware, authorize(['admin']), adminController.deleteShow);
router.get('/report', authMiddleware, authorize(['admin']), adminController.getSalesReport);
router.get('/rooms', authMiddleware, authorize(['admin']), adminController.getRooms);
router.get('/users', authMiddleware, authorize(['admin']), adminController.getUsers);
router.patch('/users/:id/promote-staff', authMiddleware, authorize(['admin']), adminController.promoteUserToStaff);

router.get('/bookings', authMiddleware, authorize(['admin', 'staff']), adminController.getAllBookings);
router.get('/booking-overview', authMiddleware, authorize(['admin', 'staff']), adminController.getBookingOverview);
router.get('/loyal-customers', authMiddleware, authorize(['admin', 'staff']), adminController.getLoyalCustomers);

module.exports = router;
