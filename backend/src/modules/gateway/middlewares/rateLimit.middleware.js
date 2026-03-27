const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');

// Connect to Redis. Override with REDIS_HOST/REDIS_PORT when needed.
const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379)
});

// Read the Lua script used for token bucket rate limiting.
const luaScript = fs.readFileSync(
  path.join(__dirname, '../scripts/token_bucket.lua'),
  'utf8'
);

// 5 requests per second, burst up to 10.
const RATE = 5;
const CAPACITY = 10;

const rateLimitMiddleware = async (req, res, next) => {
  try {
    // Use client IP as the rate-limit key.
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const key = `rate_limit:${ip}`;
    const now = Date.now() / 1000;

    const result = await redis.eval(luaScript, 1, key, RATE, CAPACITY, now, 1);

    const isAllowed = result[0] === 1;
    const tokensLeft = result[1];

    res.set('X-RateLimit-Remaining', tokensLeft);

    if (isAllowed) {
      next();
    } else {
      res.status(429).json({
        message: 'Ban gui request qua nhanh! Vui long thu lai sau.',
        retry_after: 'Vai giay'
      });
    }
  } catch (err) {
    console.error('Rate Limit Error:', err);
    // Fail open so Redis issues do not block all traffic.
    next();
  }
};

module.exports = rateLimitMiddleware;
