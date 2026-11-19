import { Router } from 'express';
import { 
  login, 
  getMe, 
  updateProfile, 
  changePassword, 
  logout 
} from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Public auth endpoints
router.post('/login', login);

// Protected auth endpoints
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.post('/logout', logout);

export default router;
