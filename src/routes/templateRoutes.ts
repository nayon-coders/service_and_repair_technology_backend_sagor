import { Router } from 'express';
import { getProblemTemplates, updateProblemTemplates } from '../controllers/templateController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Public / Authenticated read, authenticated write
router.get('/', getProblemTemplates);
router.post('/', authenticate, updateProblemTemplates);

export default router;
