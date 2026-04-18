const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const authMiddleware = require('../gateway/middlewares/auth.middleware');
const authorize = require('../gateway/middlewares/role.middleware');

router.post('/', authMiddleware, authorize(['admin']), userController.createUser);
router.get('/me', authMiddleware, userController.getMyProfile);
router.put('/me', authMiddleware, userController.updateMyProfile);
router.get('/me/bookings', authMiddleware, userController.getMyBookings);
router.get('/:id', authMiddleware, authorize(['admin']), userController.getUserById);
router.delete('/:id', authMiddleware, authorize(['admin']), userController.deleteUser);

module.exports = router;
