import { Request, Response } from 'express';
import { sendError } from '../utils/response';

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(
    res,
    `Cannot ${req.method} ${req.originalUrl} - Route not found`,
    {
      path: req.originalUrl,
      method: req.method,
    },
    404
  );
};

