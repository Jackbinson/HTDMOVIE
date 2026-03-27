const express = require('express');
const router = express.Router();
const showtimesController = require9('./showtimes.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
// Dinh nghia API POST /api/showtimes
router.post('/', authMiddleware.verifyToken, authMiddleware.isAdmin,showtimesController.createShowtime);

module.exports = router;