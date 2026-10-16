const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const AWS = require('aws-sdk');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const { PrismaClient } = require('@prisma/client');

const redisConnection = process.env.REDIS_URL
  ? { connection: { url: process.env.REDIS_URL } }
  : { connection: { host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379) } };

const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT,
  accessKeyId: process.env.S3_KEY,
  secretAccessKey: process.env.S3_SECRET,
  region: process.env.S3_REGION,
  s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
});

const prisma = new PrismaClient();

function cutClip(inputPath, start, duration, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i', inputPath,
      '-ss', String(start),
      '-t', String(duration),
      '-c', 'copy',
      outputPath
    ];
    const proc = spawn(ffmpegPath, args);
    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve(outputPath);
      } else {
        reject(new Error('ffmpeg failed with code ' + code));
      }
    });
    proc.on('error', (err) => reject(err));
  });
}

const worker = new Worker('clip-processing', async (job) => {
  console.log('Processing job', job.id, job.data);
  const { clipId, sourceKey, start, end, title } = job.data;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clipper-'));
  const sourcePath = path.join(tmpDir, path.basename(sourceKey));
  const outKey = `clips/${Date.now()}-${path.basename(sourceKey)}`;
  const outPath = path.join(tmpDir, 'out-' + path.basename(sourceKey));

  try {
    // download source
    const obj = await s3.getObject({ Bucket: process.env.S3_BUCKET, Key: sourceKey }).promise();
    fs.writeFileSync(sourcePath, obj.Body);

    const duration = Math.max(0, Math.floor(end - start));
    await cutClip(sourcePath, start, duration, outPath);

    const body = fs.readFileSync(outPath);
    await s3.putObject({
      Bucket: process.env.S3_BUCKET,
      Key: outKey,
      Body: body,
      ContentType: 'video/mp4'
    }).promise();

    await prisma.clip.update({
      where: { id: clipId },
      data: {
        clipKey: outKey,
        status: 'done',
        duration
      }
    });

    fs.unlinkSync(sourcePath);
    fs.unlinkSync(outPath);

    console.log('Job done', job.id);
    return { success: true };
  } catch (err) {
    console.error('Job failed', job.id, err);
    try {
      await prisma.clip.update({ where: { id: clipId }, data: { status: 'failed' } });
    } catch (e) {
      console.error('Failed to update clip status after error', e);
    }
    throw err;
  }
}, redisConnection);

worker.on('completed', (job) => {
  console.log('Completed job', job.id);
});

worker.on('failed', (job, err) => {
  console.error('Failed job', job.id, err);
});

console.log('Worker started, listening on clip-processing queue');
