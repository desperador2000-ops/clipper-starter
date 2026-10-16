import formidable from "formidable";
import fs from "fs";
import s3 from "../../lib/s3";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const form = formidable({ multiples: false });
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: err.message });
    const file = files.file;
    const data = fs.readFileSync(file.filepath);
    const key = `sources/${Date.now()}-${file.originalFilename}`;
    try {
      await s3
        .putObject({
          Bucket: process.env.S3_BUCKET,
          Key: key,
          Body: data,
          ContentType: file.mimetype,
        })
        .promise();
      const url = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`;
      res.json({ key, url });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });
}
