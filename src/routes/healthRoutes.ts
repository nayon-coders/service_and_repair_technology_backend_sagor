import { Router } from 'express';
import { getHealth } from '../controllers/healthController';

const router = Router();

router.get('/', getHealth);

router.get('/sync-seed', async (_req, res) => {
  try {
    const { seedDatabase } = await import('../scripts/seedDatabase');
    await seedDatabase();
    res.json({ success: true, message: 'Seed synced successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
});

export default router;

