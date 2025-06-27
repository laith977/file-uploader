import { Request, Response, NextFunction } from 'express';

/**
 * Custom error type extending the built-in Error object.
 * Allows for additional custom properties like statusCode, etc.
 */
export interface CustomError extends Error {
  statusCode?: number; // Optional HTTP status code
  [key: string]: any; // Allow any additional error details
}

/**
 * Global error handling middleware for Express.
 *
 * This middleware catches all errors passed to `next(err)`
 * and formats them into a consistent JSON response structure.
 *
 * Usage: Place this at the end of all middleware/routes:
 *   app.use(errorHandler);
 */
export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode ?? 500;

  // Destructure known fields from error object
  const {
    message = 'Internal Server Error',
    name = 'Error',
    stack,
    ...rest // Capture any other custom properties
  } = err;

  // Build the error response object
  const errorData: Record<string, any> = {
    message,
    error: name,
    stack, // Optional: include for development/debugging
    path: req.originalUrl,
    method: req.method,
    ...rest, // Include any additional error details
  };

  // Send structured error response
  res.status(statusCode).json(errorData);
};
