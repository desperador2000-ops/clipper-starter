import { Queue } from 'bullmq';

const connection = process.env.REDIS_URL
  ? { connection: { url: process.env.REDIS_URL } }
  : { connection: { host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379) } };

const queue = new Queue('clip-processing', connection);

export default queue;
