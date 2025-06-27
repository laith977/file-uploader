import { Request, Response, NextFunction } from 'express';

/**
 * Standard structure for all JSON responses.
 */
interface JsonResponse {
  success: boolean; // Indicates if the request was successful (based on status code)
  statusCode: number; // HTTP status code
  data: any; // Payload/data to return to the client
}

/**
 * Represents the original `res.json` function signature.
 */
type JsonFunction = (body: any) => Response;

/**
 * Middleware to standardize all JSON responses in the app.
 *
 * This middleware wraps `res.json` so that all responses follow the same format:
 * {
 *   success: boolean,
 *   statusCode: number,
 *   data: any
 * }
 *
 * Usage: Add this middleware globally before your routes, e.g.:
 *   app.use(responseFormatter);
 *
 * Example response:
 *   {
 *     "success": true,
 *     "statusCode": 200,
 *     "data": { ...actualData }
 *   }
 */
export const responseFormatter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Preserve the original res.json function
  const originalJson: JsonFunction = res.json.bind(res);

  // Override res.json to wrap the response body
  res.json = (data: any): Response => {
    const statusCode = res.statusCode || 200;

    const response: JsonResponse = {
      success: statusCode >= 200 && statusCode < 300,
      statusCode,
      data,
    };

    return originalJson(response);
  };

  // Move to next middleware or route handler
  next();
};
