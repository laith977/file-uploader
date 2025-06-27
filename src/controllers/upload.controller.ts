import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises'; // Promise-based fs
import { promises as fsSync, existsSync } from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { FileType } from '../types';
import { constants } from '../constants';
import { enqueueAudioConversionJob } from '../queues/audio-converter.queue';
import { enqueueImageProcessingJob } from '../queues/image-converter.queue';
import { v4 as uuidv4 } from 'uuid';

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
      console.log(originalName);
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
      const newFileName = `${uuidv4()}.${ext}`;
      const newFilePath = path.join(dateFolderPath, newFileName);
      await fs.rename(tempFilePath, newFilePath);
      // If audio but not mp3, create .conv.mp3 copy

      if (fileType === 'audio' && ext !== 'mp3') {
        // enqueue conversion job to run 1 minute later
        await enqueueAudioConversionJob({
          originalFilePath: newFilePath,
          yearMonth,
          newFileName,
        });
      } else if (fileType === 'image') {
        await enqueueImageProcessingJob({
          originalFilePath: newFilePath,
          yearMonth,
          newFileName,
          extension: ext,
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
  /**
   * Handles multiple file uploads (expects req.files from multer)
   */
  public async handleMultipleUpload(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;

      const responses = [];

      for (const file of files) {
        const originalName = file.originalname;
        const ext = path.extname(originalName).slice(1).toLowerCase();
        const fileType = getFileType(ext);
        const secondLevelFolder = ext;

        // Build target folders
        const typeFolderPath = path.join(this.UPLOAD_BASE_PATH, fileType);
        const extFolderPath = path.join(typeFolderPath, secondLevelFolder);
        const dateFolderPath = path.join(extFolderPath, yearMonth);

        // Ensure target folder exists
        await fs.mkdir(dateFolderPath, { recursive: true });

        // Move the uploaded file from temp to final location
        const tempFilePath = file.path;
        const newFileName = file.filename;
        const newFilePath = path.join(dateFolderPath, newFileName);
        await fs.rename(tempFilePath, newFilePath);

        // Enqueue jobs if needed
        if (fileType === 'audio' && ext !== 'mp3') {
          await enqueueAudioConversionJob({
            originalFilePath: newFilePath,
            yearMonth,
            newFileName,
          });
        } else if (fileType === 'image') {
          await enqueueImageProcessingJob({
            originalFilePath: newFilePath,
            yearMonth,
            newFileName,
            extension: ext,
          });
        }

        // Collect response info
        responses.push({
          originalName,
          storedName: newFileName,
          type: fileType,
          extension: ext,
          path: newFilePath,
        });
      }

      res.status(200).json({
        message: 'Files uploaded successfully',
        files: responses,
      });
    } catch (error) {
      next(error);
    }
  }
}
