import { Response } from 'express';
import { ApiResponse } from '../types';

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: T,
  error?: unknown
): Response => {
  const payload: ApiResponse<T> = {
    success,
    message,
  };

  if (data !== undefined) {
    payload.data = data;
  }

  if (error !== undefined) {
    payload.error = error;
  }

  return res.status(statusCode).json(payload);
};

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200
): Response => {
  return sendResponse(res, statusCode, true, message, data);
};

export const sendError = (
  res: Response,
  message: string,
  error?: unknown,
  statusCode = 500
): Response => {
  return sendResponse(res, statusCode, false, message, undefined, error);
};

