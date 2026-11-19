import { Router } from 'express';
import { 
  getEmployeesHandler, 
  getEmployeeByIdHandler, 
  createEmployeeHandler, 
  updateEmployeeHandler, 
  deleteEmployeeHandler, 
  bulkDeleteEmployeesHandler, 
  exportEmployeesCsvHandler,
  getNextEmployeeIdHandler
} from '../controllers/employeeController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Require login
router.use(authenticate);

// Auto-generated employee ID
router.get('/next-id', getNextEmployeeIdHandler);

// CSV Export (before /:id)
router.get('/export/csv', exportEmployeesCsvHandler);

// Bulk Delete
router.post('/bulk-delete', bulkDeleteEmployeesHandler);

// CRUD
router.get('/', getEmployeesHandler);
router.get('/:id', getEmployeeByIdHandler);
router.post('/', createEmployeeHandler);
router.put('/:id', updateEmployeeHandler);
router.delete('/:id', deleteEmployeeHandler);

export default router;

