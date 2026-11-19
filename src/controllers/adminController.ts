import { Request, Response, NextFunction } from 'express';
import { getAllRoles, getAllPermissions } from '../services/adminService';
import { sendSuccess } from '../utils/response';

export const getRoles = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const roles = await getAllRoles();
    sendSuccess(res, 'Roles retrieved successfully', { roles }, 200);
  } catch (error) {
    next(error);
  }
};

export const getPermissions = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const permissions = await getAllPermissions();
    sendSuccess(res, 'Permissions retrieved successfully', { permissions }, 200);
  } catch (error) {
    next(error);
  }
};

