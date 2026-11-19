import { LoginInput } from '../types';
import { AppError } from '../utils/appError';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateLoginInput = (body: unknown): LoginInput => {
  if (!body || typeof body !== 'object') {
    throw new AppError('Invalid request payload. Expected JSON object.', 400);
  }

  const payload = body as Record<string, unknown>;
  const errors: string[] = [];

  const rawEmail = payload.email;
  const rawPassword = payload.password;

  if (!rawEmail || typeof rawEmail !== 'string' || !rawEmail.trim()) {
    errors.push('Email is required');
  } else if (!EMAIL_REGEX.test(rawEmail.trim().toLowerCase())) {
    errors.push('A valid email address is required');
  }

  if (!rawPassword || typeof rawPassword !== 'string' || !rawPassword.trim()) {
    errors.push('Password is required');
  } else if (rawPassword.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (errors.length > 0) {
    throw new AppError(errors.join('. '), 400);
  }

  return {
    email: (rawEmail as string).trim().toLowerCase(),
    password: rawPassword as string,
  };
};

export interface UpdateProfileInput {
  name: string;
  email: string;
}

export const validateUpdateProfileInput = (body: unknown): UpdateProfileInput => {
  if (!body || typeof body !== 'object') {
    throw new AppError('Invalid request payload. Expected JSON object.', 400);
  }

  const payload = body as Record<string, unknown>;
  const errors: string[] = [];

  const rawName = payload.name;
  const rawEmail = payload.email;

  if (!rawName || typeof rawName !== 'string' || rawName.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters');
  }

  if (!rawEmail || typeof rawEmail !== 'string' || !rawEmail.trim()) {
    errors.push('Email is required');
  } else if (!EMAIL_REGEX.test(rawEmail.trim().toLowerCase())) {
    errors.push('A valid email address is required');
  }

  if (errors.length > 0) {
    throw new AppError(errors.join('. '), 400);
  }

  return {
    name: (rawName as string).trim(),
    email: (rawEmail as string).trim().toLowerCase(),
  };
};

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const validateChangePasswordInput = (body: unknown): ChangePasswordInput => {
  if (!body || typeof body !== 'object') {
    throw new AppError('Invalid request payload. Expected JSON object.', 400);
  }

  const payload = body as Record<string, unknown>;
  const errors: string[] = [];

  const rawCurrent = payload.currentPassword;
  const rawNew = payload.newPassword;
  const rawConfirm = payload.confirmPassword;

  if (!rawCurrent || typeof rawCurrent !== 'string') {
    errors.push('Current password is required');
  }

  if (!rawNew || typeof rawNew !== 'string') {
    errors.push('New password is required');
  } else if (rawNew.length < 6) {
    errors.push('New password must be at least 6 characters long');
  }

  if (rawNew !== rawConfirm) {
    errors.push('New password and confirmation do not match');
  }

  if (errors.length > 0) {
    throw new AppError(errors.join('. '), 400);
  }

  return {
    currentPassword: rawCurrent as string,
    newPassword: rawNew as string,
    confirmPassword: rawConfirm as string,
  };
};
