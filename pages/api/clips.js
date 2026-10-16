import fs from "fs";
import os from "os";
import path from "path";
import s3 from "../../lib/s3";
import prisma from "../../lib/prisma";
import { cutClip } from "../../utils/ffmpeg";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    if (req.method === "GET") {
      const clips = await prisma.clip.findMany({ orderBy: { createdAt: "desc" } });
      return res.json(clips);
    }
    return res.status(405).end();
  }

  const { sourceKey, start = 0, end, title } = req.body;
  if (!sourceKey || typeof end === "undefined") return res.status(400).json({ error: "sourceKey and end required" });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "clipper-"));
  const sourcePath = path.join(tmpDir, path.basename(sourceKey));
  const outKey = `clips/${Date.now()}-${path.basename(sourceKey)}`;
  const outPath = path.join(tmpDir, "out-" + path.basename(sourceKey));

  try {
    // Download source from S3
    const obj = await s3.getObject({ Bucket: process.env.S3_BUCKET, Key: sourceKey }).promise();
    fs.writeFileSync(sourcePath, obj.Body);

    const duration = Math.max(0, Math.floor(end - start));
    await cutClip({ inputPath: sourcePath, start, duration, outputPath: outPath });

    const body = fs.readFileSync(outPath);
    await s3.putObject({
      Bucket: process.env.S3_BUCKET,
      Key: outKey,
      Body: body,
      ContentType: "video/mp4"
    }).promise();

    const clip = await prisma.clip.create({
      data: {
        title,
        sourceKey,
        clipKey: outKey,
        start: Math.floor(start),
        end: Math.floor(end),
        duration
      }
    });

    // cleanup
    fs.unlinkSync(sourcePath);
    fs.unlinkSync(outPath);
    res.json(clip);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
