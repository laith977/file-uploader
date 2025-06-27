// src/utils/multer.util.ts

import multer, { StorageEngine, FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';
import fs from 'fs';

/**
 * Define the path where uploaded files will be stored.
 * If the directory doesn't exist, it will be created.
 */
const UPLOAD_PATH = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

/**
 * Multer storage configuration.
 * Files will be saved to the UPLOAD_PATH directory with a unique filename.
 */
const storage: StorageEngine = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_PATH); // Save files to the uploads folder
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname); // Get file extension
    const uniqueName = `${file.fieldname}-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${ext}`;
    cb(null, uniqueName); // Save file with unique name
  },
});

/**
 * Optional file filter to restrict uploads to specific mime types.
 * This function can be uncommented in the multer config below if needed.
 */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and JPG are allowed!'));
  }
};

/**
 * Export the configured multer instance.
 * - Uses disk storage.
 * - Limits file size to 100MB.
 * - File filter is optional; uncomment `fileFilter` if needed.
 */
export const upload = multer({
  storage,
  // fileFilter, // Uncomment to enable image type validation
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});
