import { Router } from 'express';
import { getRoles, getPermissions } from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Protected admin endpoints (Super Admin and Admin roles)
router.get('/roles', authenticate, authorize('Super Admin', 'Admin'), getRoles);
router.get('/permissions', authenticate, authorize('Super Admin', 'Admin'), getPermissions);

export default router;

