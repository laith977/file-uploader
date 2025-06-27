import { Request, Response, NextFunction, RequestHandler } from 'express';
import { upload } from '../utils/multer.util';

/**
 * Middleware to handle single file upload using Multer.
 *
 * @param fieldName - The name of the form field that holds the file.
 * @returns Express middleware that handles the file upload.
 */
export const uploadSingle = (fieldName: string): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Call Multer's single upload handler
    upload.single(fieldName)(req, res, (err: unknown) => {
      if (err instanceof Error) {
        // If Multer or file processing error occurs, return a 400 response
        return res
          .status(400)
          .json({ message: err.message || 'File upload error' });
      }

      // Proceed to next middleware if no errors
      next();
    });
  };
};

/**
 * Middleware to handle multiple file uploads using Multer.
 *
 * @param fieldName - The name of the form field that holds the files.
 * @param maxCount - Maximum number of files allowed (default is 10).
 * @returns Express middleware that handles multiple file uploads.
 */
export const uploadMultiple = (
  fieldName: string,
  maxCount = 10
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Call Multer's array upload handler
    upload.array(fieldName, maxCount)(req, res, (err: unknown) => {
      if (err instanceof Error) {
        // If Multer or file processing error occurs, return a 400 response
        return res
          .status(400)
          .json({ message: err.message || 'File upload error' });
      }

      // Proceed to next middleware if no errors
      next();
    });
  };
};
