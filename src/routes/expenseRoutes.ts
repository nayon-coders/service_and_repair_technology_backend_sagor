import { Router } from 'express';
import multer from 'multer';
import { 
  getExpensesHandler, 
  getExpenseByIdHandler, 
  createExpenseHandler, 
  updateExpenseHandler, 
  deleteExpenseHandler, 
  bulkDeleteExpensesHandler, 
  importExpensesHandler, 
  exportExpensesCsvHandler 
} from '../controllers/expenseController';
import { authenticate, requirePermission } from '../middleware/authMiddleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

const router = Router();

// All routes require authentication
router.use(authenticate);

// Export CSV route (needs to be before /:id)
router.get('/export/csv', requirePermission('management.expense.view'), exportExpensesCsvHandler);

// Import XLSX / CSV route
router.post(
  '/import', 
  requirePermission('management.expense.view'), 
  upload.single('file'), 
  importExpensesHandler
);

// Bulk delete
router.post(
  '/bulk-delete', 
  requirePermission('management.expense.view'), 
  bulkDeleteExpensesHandler
);

// Standard CRUD
router.get('/', requirePermission('management.expense.view'), getExpensesHandler);
router.get('/:id', requirePermission('management.expense.view'), getExpenseByIdHandler);
router.post('/', requirePermission('management.expense.view'), createExpenseHandler);
router.put('/:id', requirePermission('management.expense.view'), updateExpenseHandler);
router.delete('/:id', requirePermission('management.expense.view'), deleteExpenseHandler);

export default router;

