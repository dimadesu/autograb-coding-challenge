import { Router } from 'express';
import { VEHICLES } from '../data/vehicles.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(VEHICLES);
});

export default router;
