import { Request, Response, NextFunction } from 'express';
import { getDashboardStats } from '../services/dashboardService';
import { sendSuccess } from '../utils/response';

export const getStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await getDashboardStats();
    sendSuccess(res, 'Dashboard statistics retrieved successfully', stats, 200);
  } catch (error) {
    next(error);
  }
};

