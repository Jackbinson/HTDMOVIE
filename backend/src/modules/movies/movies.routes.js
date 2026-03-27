// src/modules/movies/movies.routes.js
const express = require('express');
const router = express.Router();
const movieController = require('./movies.controller'); 
const authMiddleware = require('../../modules/gateway/middlewares/auth.middleware');
const roleMiddleware = require('../../modules/gateway/middlewares/role.middleware');
const upload = require('../../modules/gateway/middlewares/upload.middleware');
const validate = require('../../modules/gateway/middlewares/validate.middleware');
const { createMovieSchema } = require('./movies.schema');

// DÒNG BÁO DANH (Dùng để bắt bệnh)
console.log('File movies.routes.js ĐÃ ĐƯỢC LOAD VÀO SERVER!');

// 1. Public API: Ai cũng xem được danh sách phim
router.get('/', movieController.getMovies);

// 2. Admin API: Thêm phim mới
router.post('/', 
    authMiddleware,           
    roleMiddleware(['admin']), 
    upload.single('poster'),   
    validate(createMovieSchema),
    movieController.createMovie 
);
router.get('/:id', movieController.getMovieById);
// 3. Admin API: Cập nhật riêng tấm ảnh poster
router.patch('/:id/poster', 
    authMiddleware, 
    roleMiddleware(['admin']), 
    upload.single('poster'), 
    movieController.updateMoviePoster
);

module.exports = router;