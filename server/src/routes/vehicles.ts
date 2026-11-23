import { Router } from 'express';
import { vehicleRepository } from '../repositories/vehicles.ts';

const router = Router();

router.get('/', async (_req, res) => {
  const [catalog, commonVehicles] = await Promise.all([
    vehicleRepository.getCatalog(),
    vehicleRepository.getCommonVehicles(),
  ]);
  res.json({ catalog, commonVehicles });
});

export default router;
