// import Redis from 'ioredis';
export const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT as string, 10) || 6379,
};
// const redis = new Redis(redisOptions);

// redis.on('connect', () => {
//   console.log('Connected to Redis');
// });

// redis.on('error', (err) => {
//   console.error('Redis error:', err);
// });

// export default redis;
