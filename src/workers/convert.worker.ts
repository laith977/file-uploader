// worker.ts
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

ffmpeg.setFfmpegPath(ffmpegPath as string);

const UPLOAD_BASE_PATH = path.join(__dirname, '../../uploads');

export async function convertToMp3(
  originalFilePath: string,
  yearMonth: string,
  newFileName: string
) {
  console.log(
    `[convertToMp3] Starting conversion for file: ${originalFilePath}`
  );

  const mp3FolderPath = path.join(UPLOAD_BASE_PATH, 'audio', 'mp3', yearMonth);
  console.log(`[convertToMp3] Target MP3 folder path: ${mp3FolderPath}`);

  if (!existsSync(mp3FolderPath)) {
    console.log(`[convertToMp3] MP3 folder does not exist, creating...`);
    await fs.mkdir(mp3FolderPath, { recursive: true });
    console.log(`[convertToMp3] MP3 folder created.`);
  } else {
    console.log(`[convertToMp3] MP3 folder already exists.`);
  }

  const baseFileName = path.parse(newFileName).name;
  const mp3CopyPath = path.join(mp3FolderPath, baseFileName + '.conv.mp3');
  console.log(`[convertToMp3] Output MP3 path: ${mp3CopyPath}`);

  return new Promise<void>((resolve, reject) => {
    ffmpeg(originalFilePath)
      .audioCodec('libmp3lame')
      .toFormat('mp3')
      .on('start', (commandLine) => {
        console.log(`[FFmpeg] Started with command: ${commandLine}`);
      })
      .on('progress', (progress) => {
        console.log(
          `[FFmpeg] Processing: ${progress.percent?.toFixed(2)}% done`
        );
      })
      .on('error', (err) => {
        console.error(`[FFmpeg] Error during conversion:`, err);
        reject(err);
      })
      .on('end', () => {
        console.log(
          `[FFmpeg] Conversion finished successfully: ${mp3CopyPath}`
        );
        resolve();
      })
      .save(mp3CopyPath);
  });
}
