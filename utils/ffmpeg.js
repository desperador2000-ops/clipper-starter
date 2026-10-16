import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import ffmpegPath from "ffmpeg-static";

export function cutClip({ inputPath, start, duration, outputPath }) {
  return new Promise((resolve, reject) => {
    const args = [
      "-y",
      "-i", inputPath,
      "-ss", String(start),
      "-t", String(duration),
      "-c", "copy",
      outputPath
    ];
    const proc = spawn(ffmpegPath, args);
    proc.on("close", (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve(outputPath);
      } else {
        reject(new Error("ffmpeg failed with code " + code));
      }
    });
    proc.on("error", (err) => reject(err));
  });
}
