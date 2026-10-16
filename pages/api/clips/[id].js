import { getServerSession } from 'next-auth';
import { authOptions } from '../../pages/api/auth/[...nextauth]';
import s3 from '../../lib/s3';
import prisma from '../../lib/prisma';
import { requireAuth } from '../../lib/auth';

function getObjectUrl(key) {
  if (!key) return null;
  const expires = Number(process.env.PRESIGNED_EXPIRES || 3600);
  try {
    // If using custom endpoint (MinIO), construct direct URL; for AWS S3, generate presigned URL
    if (process.env.S3_ENDPOINT && process.env.S3_FORCE_PATH_STYLE === 'true') {
      // For MinIO/dev return a directly accessible URL (bucket path)
      return `${process.env.S3_ENDPOINT.replace(/\/$/, '')}/${process.env.S3_BUCKET}/${key}`;
    }
    // AWS S3 presigned
    const url = s3.getSignedUrl('getObject', { Bucket: process.env.S3_BUCKET, Key: key, Expires: expires });
    return url;
  } catch (e) {
    console.error('getObjectUrl error', e);
    return null;
  }
}

export default async function handler(req, res) {
  const { query, method } = req;
  const { id } = query;

  if (method === 'GET') {
    try {
      const clip = await prisma.clip.findUnique({ where: { id } });
      if (!clip) return res.status(404).json({ error: 'Clip not found' });

      const url = clip.clipKey ? getObjectUrl(clip.clipKey) : null;
      return res.json({ ...clip, url });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }

  if (method === 'DELETE') {
    // require auth and owner
    const session = await requireAuth(req, res);
    if (!session) return;

    try {
      const clip = await prisma.clip.findUnique({ where: { id } });
      if (!clip) return res.status(404).json({ error: 'Clip not found' });

      const owner = await prisma.user.findUnique({ where: { email: session.user.email } });
      if (!owner || clip.ownerId !== owner.id) return res.status(403).json({ error: 'Forbidden' });

      // delete object(s) from S3 if present
      if (clip.clipKey) {
        try {
          await s3.deleteObject({ Bucket: process.env.S3_BUCKET, Key: clip.clipKey }).promise();
        } catch (e) {
          console.error('Failed to delete clip object', e);
        }
      }

      await prisma.clip.delete({ where: { id } });
      return res.json({ success: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).end();
}
