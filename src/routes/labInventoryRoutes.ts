import { Router } from 'express';
import { 
  getLabPartsHandler,
  getLabInsHandler, 
  getLabInByIdHandler, 
  createLabInHandler, 
  updateLabInHandler, 
  deleteLabInHandler, 
  bulkDeleteLabInsHandler, 
  exportLabInsCsvHandler,
  getLabOutsHandler, 
  getLabOutByIdHandler, 
  createLabOutHandler, 
  updateLabOutHandler, 
  deleteLabOutHandler, 
  bulkDeleteLabOutsHandler, 
  exportLabOutsCsvHandler
} from '../controllers/labInventoryController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Require login for all lab service endpoints
router.use(authenticate);

// Parts catalog (for dropdown selectors)
router.get('/parts', getLabPartsHandler);

// ==========================================
// LAB IN ROUTES (/service/lab-in)
// ==========================================
router.get('/in/export/csv', exportLabInsCsvHandler);
router.post('/in/bulk-delete', bulkDeleteLabInsHandler);
router.get('/in', getLabInsHandler);
router.get('/in/:id', getLabInByIdHandler);
router.post('/in', createLabInHandler);
router.put('/in/:id', updateLabInHandler);
router.delete('/in/:id', deleteLabInHandler);

// ==========================================
// LAB OUT ROUTES (/service/lab-out)
// ==========================================
router.get('/out/export/csv', exportLabOutsCsvHandler);
router.post('/out/bulk-delete', bulkDeleteLabOutsHandler);
router.get('/out', getLabOutsHandler);
router.get('/out/:id', getLabOutByIdHandler);
router.post('/out', createLabOutHandler);
router.put('/out/:id', updateLabOutHandler);
router.delete('/out/:id', deleteLabOutHandler);

export default router;

