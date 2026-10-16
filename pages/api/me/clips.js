import { requireAuth } from '../../lib/auth';
import prisma from '../../lib/prisma';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);

export default async function handler(req, res) {
  const session = await requireAuth(req, res);
  if (!session) return;

  const owner = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!owner) return res.status(404).json({ error: 'User not found' });

  const clips = await prisma.clip.findMany({ where: { ownerId: owner.id }, orderBy: { createdAt: 'desc' } });
  res.json(clips);
}
