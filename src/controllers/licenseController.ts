import { Request, Response } from 'express';
import { licenseService } from '../services/licenseService';

export const getLicenseStatus = async (_req: Request, res: Response): Promise<void> => {
  const state = licenseService.getState();
  res.status(200).json({
    success: true,
    data: state,
  });
};

export const refreshLicense = async (_req: Request, res: Response): Promise<void> => {
  const state = await licenseService.checkRemoteLicense();
  res.status(200).json({
    success: true,
    message: state.status === 'ACTIVE' ? 'License is active' : 'License is suspended',
    data: state,
  });
};

export const activateLicenseKey = async (req: Request, res: Response): Promise<void> => {
  const { key } = req.body;
  const result = await licenseService.activatePermanentKey(key);

  if (result.success) {
    res.status(200).json({
      success: true,
      message: result.message,
      data: licenseService.getState(),
    });
  } else {
    res.status(400).json({
      success: false,
      message: result.message,
    });
  }
};
