const express = require('express');
const router = express.Router();
const recommendController = require('./recommend.controller');

router.get('/trending', recommendController.getTrendingMovies);


router.get('/hero', recommendController.getHeroBanner);

module.exports = router;