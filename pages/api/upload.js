import formidable from "formidable";
import fs from "fs";
import s3 from "../../lib/s3";
import { requireAuth } from "../../lib/auth";
import { checkUploadQuota, incrementUploadCount } from "../../lib/quota";

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300MB
const ALLOWED_MIME_PREFIXES = ["video/", "audio/"];

export default async function handler(req, res) {
  const session = await requireAuth(req, res);
  if (!session) return;

  if (req.method !== "POST") return res.status(405).end();

  // quota check
  const quota = await checkUploadQuota(session.user.email);
  if (!quota.ok) {
    return res.status(429).json({ error: 'Quota exceeded: ' + quota.reason });
  }

  const form = formidable({
    multiples: false,
    maxFileSize: MAX_FILE_SIZE,
    filter: (part) => {
      if (part.name === 'file') {
        const mime = part.mimetype || '';
        return ALLOWED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix));
      }
      return true;
    }
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Fichier trop volumineux (max 300MB)' });
      }
      return res.status(400).json({ error: err.message || 'Erreur upload' });
    }

    const file = files.file;
    if (!file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const mime = file.mimetype || '';
    const isAllowed = ALLOWED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix));
    if (!isAllowed) {
      return res.status(415).json({ error: 'Type de fichier non autorisé. Utilise uniquement video/* ou audio/*' });
    }

    const data = fs.readFileSync(file.filepath);
    const key = `sources/${Date.now()}-${String(file.originalFilename || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    try {
      await s3.putObject({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: data,
        ContentType: file.mimetype,
      }).promise();

      // increment quota count
      await incrementUploadCount(session.user.email);

      const url = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`;
      res.json({ key, url, size: file.size });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });
}
