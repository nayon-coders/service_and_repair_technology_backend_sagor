import { Router } from 'express';
import {
  getLicenseStatus,
  refreshLicense,
  activateLicenseKey,
} from '../controllers/licenseController';

const router = Router();

router.get('/status', getLicenseStatus);
router.post('/refresh', refreshLicense);
router.post('/activate', activateLicenseKey);

export default router;
