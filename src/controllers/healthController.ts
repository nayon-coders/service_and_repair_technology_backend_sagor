import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response';

export const getHealth = (_req: Request, res: Response): void => {
  sendSuccess(
    res,
    'Business Management API is running',
    {
      status: 'healthy',
    },
    200
  );
};

