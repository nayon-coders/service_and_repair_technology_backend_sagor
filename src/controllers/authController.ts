import { Request, Response, NextFunction } from 'express';
import { 
  validateLoginInput, 
  validateUpdateProfileInput, 
  validateChangePasswordInput 
} from '../validators/authValidator';
import { 
  loginAdmin, 
  getAdminProfile, 
  updateAdminProfile, 
  changeAdminPassword 
} from '../services/authService';
import { sendSuccess } from '../utils/response';
import { env } from '../config/environment';

const COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input = validateLoginInput(req.body);
    const result = await loginAdmin(input);

    // Set secure HttpOnly cookie for browser clients
    res.cookie('access_token', result.token, {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: env.nodeEnv === 'production' ? 'strict' : 'lax',
      maxAge: COOKIE_MAX_AGE_MS,
    });

    sendSuccess(
      res,
      'Login successful',
      {
        user: result.user,
        token: result.token,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(new Error('User not attached to request context'));
    }

    // Refresh user state from database to ensure up-to-date role/active flags
    const user = await getAdminProfile(req.user.id);

    sendSuccess(res, 'Current authenticated admin profile retrieved', { user }, 200);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(new Error('User not attached to request context'));
    }

    const input = validateUpdateProfileInput(req.body);
    const user = await updateAdminProfile(req.user.id, input);

    sendSuccess(res, 'Profile updated successfully', { user }, 200);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(new Error('User not attached to request context'));
    }

    const input = validateChangePasswordInput(req.body);
    await changeAdminPassword(req.user.id, input);

    sendSuccess(res, 'Password changed successfully', null, 200);
  } catch (error) {
    next(error);
  }
};

export const logout = (
  _req: Request,
  res: Response
): void => {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'strict' : 'lax',
  });

  sendSuccess(res, 'Logged out successfully', null, 200);
};
