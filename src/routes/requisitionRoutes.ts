import { Router } from 'express';
import {
  getRequisitionsHandler,
  getNextEstimateNoHandler,
  getRequisitionByIdHandler,
  createRequisitionHandler,
  updateRequisitionHandler,
  deleteRequisitionHandler,
  bulkDeleteRequisitionsHandler,
  exportRequisitionsCsvHandler,
} from '../controllers/requisitionController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/next-number', getNextEstimateNoHandler);
router.get('/export/csv', exportRequisitionsCsvHandler);
router.post('/bulk-delete', bulkDeleteRequisitionsHandler);

router.get('/', getRequisitionsHandler);
router.get('/:id', getRequisitionByIdHandler);
router.post('/', createRequisitionHandler);
router.put('/:id', updateRequisitionHandler);
router.delete('/:id', deleteRequisitionHandler);

export default router;

