const express = require('express');
const router = express.Router();
const seatController = require('./seats.controller');

// React sẽ gọi: GET http://localhost:5000/api/seats/show/1
router.get('/show/:showId', seatController.getSeatsByShowId);

module.exports = router;