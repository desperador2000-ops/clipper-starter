// Simple rate limiter and quota checker using Redis
import Redis from 'ioredis';
import prisma from './prisma';

const redis = new Redis(process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);

export async function checkUploadQuota(userEmail, maxUploadsPerDay = 20, maxStorageBytes = 5 * 1024 * 1024 * 1024) {
  if (!userEmail) return { ok: false, reason: 'unknown user' };
  const dateKey = `uploads:${userEmail}:${new Date().toISOString().slice(0,10)}`;
  const uploadsToday = Number(await redis.get(dateKey) || 0);
  if (uploadsToday >= maxUploadsPerDay) return { ok: false, reason: 'uploads_per_day_limit' };

  // check storage used by user (sum of clip sizes) - approximate
  const owner = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!owner) return { ok: false, reason: 'user_not_found' };
  const clips = await prisma.clip.findMany({ where: { ownerId: owner.id } });
  const totalBytes = clips.reduce((acc, c) => acc + (c.size || 0), 0);
  if (totalBytes >= maxStorageBytes) return { ok: false, reason: 'storage_limit' };

  return { ok: true, uploadsToday };
}

export async function incrementUploadCount(userEmail) {
  const dateKey = `uploads:${userEmail}:${new Date().toISOString().slice(0,10)}`;
  await redis.incr(dateKey);
  // set expiry 2 days
  await redis.expire(dateKey, 60 * 60 * 24 * 2);
}
