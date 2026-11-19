import { Router } from 'express';
import multer from 'multer';
import { 
  getIncomesHandler, 
  getIncomeByIdHandler, 
  createIncomeHandler, 
  updateIncomeHandler, 
  deleteIncomeHandler, 
  bulkDeleteIncomesHandler, 
  importIncomesHandler, 
  exportIncomesCsvHandler 
} from '../controllers/incomeController';
import { authenticate, requirePermission } from '../middleware/authMiddleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

const router = Router();

// All routes require authentication
router.use(authenticate);

// Export CSV route (needs to be before /:id)
router.get('/export/csv', requirePermission('management.income.view'), exportIncomesCsvHandler);

// Import XLSX / CSV route
router.post(
  '/import', 
  requirePermission('management.income.create'), 
  upload.single('file'), 
  importIncomesHandler
);

// Bulk delete
router.post(
  '/bulk-delete', 
  requirePermission('management.income.delete'), 
  bulkDeleteIncomesHandler
);

// Standard CRUD
router.get('/', requirePermission('management.income.view'), getIncomesHandler);
router.get('/:id', requirePermission('management.income.view'), getIncomeByIdHandler);
router.post('/', requirePermission('management.income.create'), createIncomeHandler);
router.put('/:id', requirePermission('management.income.edit'), updateIncomeHandler);
router.delete('/:id', requirePermission('management.income.delete'), deleteIncomeHandler);

export default router;

