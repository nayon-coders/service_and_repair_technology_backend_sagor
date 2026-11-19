import { Router } from 'express';
import { 
  getSalaryRecordsHandler, 
  getSalaryRecordByIdHandler, 
  createSalaryRecordHandler, 
  updateSalaryRecordHandler, 
  deleteSalaryRecordHandler, 
  bulkDeleteSalaryRecordsHandler, 
  exportSalaryCsvHandler 
} from '../controllers/salaryController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

// Export CSV
router.get('/export/csv', exportSalaryCsvHandler);

// Bulk Delete
router.post('/bulk-delete', bulkDeleteSalaryRecordsHandler);

// CRUD
router.get('/', getSalaryRecordsHandler);
router.get('/:id', getSalaryRecordByIdHandler);
router.post('/', createSalaryRecordHandler);
router.put('/:id', updateSalaryRecordHandler);
router.delete('/:id', deleteSalaryRecordHandler);

export default router;

