import { Router } from 'express';
import {
  getTaDaBillsHandler,
  getNextTaDaBillNoHandler,
  getTaDaBillByIdHandler,
  createTaDaBillHandler,
  updateTaDaBillHandler,
  deleteTaDaBillHandler,
  bulkDeleteTaDaBillsHandler,
  exportTaDaCsvHandler,
} from '../controllers/taDaController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/next-number', getNextTaDaBillNoHandler);
router.get('/export/csv', exportTaDaCsvHandler);
router.post('/bulk-delete', bulkDeleteTaDaBillsHandler);

router.get('/', getTaDaBillsHandler);
router.get('/:id', getTaDaBillByIdHandler);
router.post('/', createTaDaBillHandler);
router.put('/:id', updateTaDaBillHandler);
router.delete('/:id', deleteTaDaBillHandler);

export default router;

