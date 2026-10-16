import fs from "fs";
import os from "os";
import path from "path";
import s3 from "../../lib/s3";
import prisma from "../../lib/prisma";
import { cutClip } from "../../utils/ffmpeg";
import { requireAuth } from "../../lib/auth";

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

  const owner = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "clipper-"));
  const sourcePath = path.join(tmpDir, path.basename(sourceKey));
  const outKey = `clips/${Date.now()}-${path.basename(sourceKey)}`;
  const outPath = path.join(tmpDir, "out-" + path.basename(sourceKey));

  try {
    const obj = await s3.getObject({ Bucket: process.env.S3_BUCKET, Key: sourceKey }).promise();
    fs.writeFileSync(sourcePath, obj.Body);

    const duration = Math.max(0, Math.floor(endNum - startNum));
    await cutClip({ inputPath: sourcePath, start: startNum, duration, outputPath: outPath });

    const body = fs.readFileSync(outPath);
    await s3.putObject({
      Bucket: process.env.S3_BUCKET,
      Key: outKey,
      Body: body,
      ContentType: "video/mp4"
    }).promise();

    const clip = await prisma.clip.create({
      data: {
        title: title || "Clip",
        sourceKey,
        clipKey: outKey,
        start: Math.floor(startNum),
        end: Math.floor(endNum),
        duration,
        ownerId: owner ? owner.id : null
      }
    });

    fs.unlinkSync(sourcePath);
    fs.unlinkSync(outPath);
    res.json(clip);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
