const rateLimit = require('./middlewares/rateLimit.middleware');

// Áp dụng Rate Limit cho API Login
router.post('/auth/login', rateLimit, authController.login);