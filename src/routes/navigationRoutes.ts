import { Router } from 'express';
import { getNavigation } from '../controllers/navigationController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Protected navigation endpoint
router.get('/', authenticate, getNavigation);

export default router;

