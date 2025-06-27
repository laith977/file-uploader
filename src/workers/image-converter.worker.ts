import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import sharp from 'sharp';

const UPLOAD_BASE_PATH = path.join(__dirname, '../../uploads');

export async function processImageJob(
  originalFilePath: string,
  yearMonth: string,
  newFileName: string,
  extension: string
) {
  console.log(`[ImageWorker] Processing image: ${originalFilePath}`);

  const imageFolderBase = path.join(UPLOAD_BASE_PATH, 'image');

  // CDN copy folder
  const cdnFolder = path.join(imageFolderBase, 'cdn', yearMonth);
  await fs.mkdir(cdnFolder, { recursive: true });

  // Thumbnails folder
  const thumbsFolder = path.join(imageFolderBase, 'thumbnails', yearMonth);
  await fs.mkdir(thumbsFolder, { recursive: true });

  const baseFileName = path.parse(newFileName).name;

  // 1. If it's .webp, also save a PNG version
  const pngFolderPath = path.join(imageFolderBase, 'png', yearMonth);
  await fs.mkdir(pngFolderPath, { recursive: true });

  if (extension === 'webp') {
    const pngPath = path.join(pngFolderPath, baseFileName + '.conv.png');

    await sharp(originalFilePath).png().toFile(pngPath);
    console.log(`[ImageWorker] Created PNG copy at: ${pngPath}`);
  }

  // 2. CDN-compatible version (example: standardized JPEG at 1200px width)
  const cdnCopyPath = path.join(cdnFolder, baseFileName + '.cdn.jpg');
  await sharp(originalFilePath)
    .resize({ width: 1200 })
    .jpeg({ quality: 90 })
    .toFile(cdnCopyPath);
  console.log(`[ImageWorker] Created CDN copy at: ${cdnCopyPath}`);

  // 3. Thumbnails in multiple sizes
  const thumbnailSizes = [64, 256, 512];
  for (const size of thumbnailSizes) {
    const thumbPath = path.join(
      thumbsFolder,
      `${baseFileName}.${size}x${size}.jpg`
    );
    await sharp(originalFilePath)
      .resize(size, size, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(thumbPath);
    console.log(`[ImageWorker] Created thumbnail at: ${thumbPath}`);
  }

  console.log(
    `[ImageWorker] Image processing complete for: ${originalFilePath}`
  );
}
