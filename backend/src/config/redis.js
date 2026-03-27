const Redis = require('ioredis');

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = Number(process.env.REDIS_PORT || 6379);

const redisClient = new Redis({
  host: redisHost,
  port: redisPort
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () =>
  console.log(`Redis connected: redis://${redisHost}:${redisPort}`)
);

module.exports = redisClient;
