import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { isValidVehicleSelection } from '../data/vehicles.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isPlainText = file.mimetype === 'text/plain' || ext === '.txt';
    if (!isPlainText) {
      const err = new Error('Logbook must be a plain text (.txt) file.');
      err.statusCode = 400;
      return cb(err);
    }
    return cb(null, true);
  },
});

router.post('/', upload.single('logbook'), (req, res) => {
  const { make, model, badge } = req.body;

  if (!make || !model || !badge) {
    return res.status(400).json({
      error: 'Make, model, and badge are all required.',
    });
  }

  if (!isValidVehicleSelection(make, model, badge)) {
    return res.status(400).json({
      error: 'Invalid make, model, and badge combination.',
    });
  }

  if (!req.file) {
    return res.status(400).json({
      error: 'A plain text service logbook file is required.',
    });
  }

  const content = req.file.buffer.toString('utf-8');

  return res.status(200).json({
    make,
    model,
    badge,
    logbook: {
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      content,
    },
  });
});

export default router;
