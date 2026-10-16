import s3 from "../../lib/s3";
import prisma from "../../lib/prisma";
import { requireAuth } from "../../lib/auth";
import queue from "../../lib/queue";

export default async function handler(req, res) {
  const session = await requireAuth(req, res);
  if (!session) return;

  if (req.method === "GET") {
    const clips = await prisma.clip.findMany({ orderBy: { createdAt: "desc" } });
    return res.json(clips);
  }

  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { sourceKey, start = 0, end, title } = req.body;
  if (!sourceKey || typeof end === "undefined") {
    return res.status(400).json({ error: "sourceKey and end required" });
  }

  const startNum = Number(start);
  const endNum = Number(end);
  if (!Number.isFinite(startNum) || !Number.isFinite(endNum) || endNum <= startNum) {
    return res.status(400).json({ error: "start/end invalid" });
  }

  const owner = await prisma.user.findUnique({ where: { email: session.user.email } });

  try {
    const clip = await prisma.clip.create({
      data: {
        title: title || "Clip",
        sourceKey,
        start: Math.floor(startNum),
        end: Math.floor(endNum),
        duration: null,
        ownerId: owner ? owner.id : null,
        status: 'queued'
      }
    });

    const job = await queue.add('process', {
      clipId: clip.id,
      sourceKey,
      start: startNum,
      end: endNum,
      title: title || 'Clip'
    });

    res.json({ clip, jobId: job.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
