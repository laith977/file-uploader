import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises'; // Promise-based fs
import { promises as fsSync, existsSync } from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { FileType } from '../types';
import { constants } from '../constants';

ffmpeg.setFfmpegPath(ffmpegPath as string);

// Map extensions to type for dynamic foldering
function getFileType(ext: string): FileType {
  ext = ext.toLowerCase();
  if (constants.AUDIO_EXTENSIONS.includes(ext)) return 'audio';
  if (constants.IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (constants.VIDEO_EXTENSIONS.includes(ext)) return 'video';
  if (constants.DOCUMENT_EXTENSIONS.includes(ext)) return 'document';
  return 'other';
}

export class UploadController {
  // Base upload folder
  private UPLOAD_BASE_PATH = path.join(__dirname, '../../uploads');

  constructor() {
    // Ensure base upload directory exists
    fsSync
      .mkdir(this.UPLOAD_BASE_PATH, { recursive: true })
      .catch(console.error);
  }

  // Core upload handler (expects req.file from multer)
  public async handleUpload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const originalName = req.file.originalname;
      const ext = path.extname(originalName).slice(1).toLowerCase(); // get extension without dot
      const fileType = getFileType(ext);
      const secondLevelFolder = ext; // e.g. 'mp3', 'ogg', 'png'

      // Create dynamic folder paths
      const typeFolderPath = path.join(this.UPLOAD_BASE_PATH, fileType);
      const extFolderPath = path.join(typeFolderPath, secondLevelFolder);

      // Get current year-month string like '2025-06'
      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;

      // Add year-month folder inside extension folder
      const dateFolderPath = path.join(extFolderPath, yearMonth);

      // Create directories if not exist
      await fs.mkdir(dateFolderPath, { recursive: true });

      // Multer saved file at req.file.path (if diskStorage used)
      const tempFilePath = req.file.path;

      // Build new file path inside year-month folder
      const newFileName = req.file.filename; // use multer-generated name or create your own
      const newFilePath = path.join(dateFolderPath, newFileName);

      // Move file to final folder
      await fs.rename(tempFilePath, newFilePath);

      // If audio but not mp3, create .conv.mp3 copy

      if (fileType === 'audio' && ext !== 'mp3') {
        const mp3FolderPath = path.join(
          this.UPLOAD_BASE_PATH,
          'audio',
          'mp3',
          yearMonth
        );

        if (!existsSync(mp3FolderPath)) {
          await fs.mkdir(mp3FolderPath, { recursive: true });
        }

        const baseFileName = path.parse(newFileName).name;
        const mp3CopyPath = path.join(
          mp3FolderPath,
          baseFileName + '.conv.mp3'
        );

        await new Promise<void>((resolve, reject) => {
          ffmpeg(newFilePath)
            .audioCodec('libmp3lame') // optional, but explicit
            .toFormat('mp3')
            .on('start', (commandLine) => {
              console.log('Spawned FFmpeg with command: ' + commandLine);
            })
            .on('error', (err) => {
              console.error('FFmpeg error:', err);
              reject(err);
            })
            .on('end', () => {
              console.log('Audio converted to MP3:', mp3CopyPath);
              resolve();
            })
            .save(mp3CopyPath);
        });
      }
      // Respond with success and file info
      res.status(200).json({
        message: 'File uploaded successfully',
        file: {
          originalName,
          storedName: newFileName,
          type: fileType,
          extension: ext,
          path: newFilePath,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
