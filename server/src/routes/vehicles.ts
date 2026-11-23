import { Router } from 'express';
import { vehicleRepository } from '../repositories/vehicles.ts';

const router = Router();

router.get('/', async (_req, res) => {
  const vehicles = await vehicleRepository.getCatalog();
  res.json(vehicles);
});

export default router;
