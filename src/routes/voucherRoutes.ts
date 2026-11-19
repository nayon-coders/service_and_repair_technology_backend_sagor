import { Router } from 'express';
import {
  getVouchersHandler,
  getNextVoucherNoHandler,
  getVoucherByIdHandler,
  createVoucherHandler,
  updateVoucherHandler,
  deleteVoucherHandler,
  bulkDeleteVouchersHandler,
  exportVouchersCsvHandler,
} from '../controllers/voucherController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Next voucher number generator helper
router.get('/next-number', getNextVoucherNoHandler);

// CSV Export (placed before /:id)
router.get('/export/csv', exportVouchersCsvHandler);

// Bulk deletion
router.post('/bulk-delete', bulkDeleteVouchersHandler);

// Standard CRUD
router.get('/', getVouchersHandler);
router.get('/:id', getVoucherByIdHandler);
router.post('/', createVoucherHandler);
router.put('/:id', updateVoucherHandler);
router.delete('/:id', deleteVoucherHandler);

export default router;

