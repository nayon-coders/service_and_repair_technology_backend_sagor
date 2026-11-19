import { Request, Response, NextFunction } from 'express';
import { getUserNavigation } from '../services/navigationService';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/appError';

export const getNavigation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required to retrieve navigation menus', 401));
    }

    const items = await getUserNavigation(req.user);
    sendSuccess(res, 'Navigation menu retrieved successfully', { items }, 200);
  } catch (error) {
    next(error);
  }
};

