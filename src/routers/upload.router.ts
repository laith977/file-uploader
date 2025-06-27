// src/routes/upload.router.ts
import { Router } from 'express';

import { UploadController } from '../controllers/upload.controller';

import { asyncHandler } from '../utils/async-handler';
import { uploadSingle } from '../middlewares/upload.middleware';



export class UploadRouter {
  public router = Router();
  private controller = new UploadController();

  constructor() {
    this.routes();
  }

  private routes() {
    // Single file upload route
    this.router.post(
      '/upload',
      uploadSingle('file'), // Use the centralized upload middleware
      asyncHandler((req, res, next) => {
        return this.controller.handleUpload(req, res, next);
      })
    );
  }
}
