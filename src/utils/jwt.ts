import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/environment';
import { JwtPayload } from '../types';
import { AppError } from './appError';

export const generateToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.jwtSecret, options);
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    return decoded;
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Authentication token has expired. Please log in again.', 401);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid authentication token.', 401);
    }
    throw new AppError('Could not authenticate token.', 401);
  }
};

