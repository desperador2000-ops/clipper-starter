import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);

export default async function handler(req, res) {
  const session = req.headers['x-ss-session'] || null; // not using auth for SSE here

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sub = new Redis(process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);
  sub.subscribe('clip_updates', (err, count) => {
    if (err) {
      console.error('subscribe error', err);
    }
  });

  sub.on('message', (channel, message) => {
    res.write(`data: ${message}\n\n`);
  });

  req.on('close', () => {
    sub.disconnect();
    res.end();
  });
}
