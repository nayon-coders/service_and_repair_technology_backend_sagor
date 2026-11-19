import { Router } from 'express';
import { 
  getOfficeRentsHandler, 
  getOfficeRentByIdHandler, 
  createOfficeRentHandler, 
  updateOfficeRentHandler, 
  deleteOfficeRentHandler, 
  bulkDeleteOfficeRentsHandler, 
  exportOfficeRentsCsvHandler 
} from '../controllers/officeRentController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Require login for all office rent operations
router.use(authenticate);

// CSV Export (Must be before /:id)
router.get('/export/csv', exportOfficeRentsCsvHandler);

// Bulk Delete
router.post('/bulk-delete', bulkDeleteOfficeRentsHandler);

// Standard CRUD
router.get('/', getOfficeRentsHandler);
router.get('/:id', getOfficeRentByIdHandler);
router.post('/', createOfficeRentHandler);
router.put('/:id', updateOfficeRentHandler);
router.delete('/:id', deleteOfficeRentHandler);

export default router;

