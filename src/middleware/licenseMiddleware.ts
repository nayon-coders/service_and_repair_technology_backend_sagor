import { Request, Response, NextFunction } from 'express';
import { licenseService } from '../services/licenseService';

export const licenseMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Allow health checks and license management routes
  if (
    req.path.startsWith('/health') ||
    req.path.startsWith('/license') ||
    req.originalUrl.includes('/health') ||
    req.originalUrl.includes('/license')
  ) {
    return next();
  }

  const state = licenseService.getState();
  if (!state.isValid || state.status === 'SUSPENDED') {
    res.status(403).json({
      success: false,
      licenseSuspended: true,
      message:
        state.message ||
        'সফটওয়্যারের লাইসেন্স বা পেমেন্ট সংক্রান্ত কারণে সার্ভিস সাময়িকভাবে স্থগিত করা হয়েছে। অনুগ্রহ করে ডেভেলপারের সাথে যোগাযোগ করুন।',
      contactPhone: state.contactPhone,
      contactEmail: state.contactEmail,
    });
    return;
  }

  next();
};
