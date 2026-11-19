import { Router } from 'express';
import {
  getGatePassesHandler,
  getNextGatePassNoHandler,
  getGatePassByIdHandler,
  createGatePassHandler,
  updateGatePassHandler,
  deleteGatePassHandler,
  bulkDeleteGatePassesHandler,
  exportGatePassesCsvHandler,
} from '../controllers/gatePassController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/next-number', getNextGatePassNoHandler);
router.get('/export/csv', exportGatePassesCsvHandler);
router.post('/bulk-delete', bulkDeleteGatePassesHandler);

router.get('/', getGatePassesHandler);
router.get('/:id', getGatePassByIdHandler);
router.post('/', createGatePassHandler);
router.put('/:id', updateGatePassHandler);
router.delete('/:id', deleteGatePassHandler);

export default router;

