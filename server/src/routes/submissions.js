import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { isValidVehicleSelection } from '../data/vehicles.js';

const router = Router();

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TEXT_EXTENSIONS = new Set(['.txt', '.log', '.md', '.csv', '']);
const GENERIC_MIME_TYPES = new Set(['', 'application/octet-stream']);
const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

function isAllowedPlainTextUpload(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  if (mime.startsWith('text/')) {
    return true;
  }

  return GENERIC_MIME_TYPES.has(mime) && ALLOWED_TEXT_EXTENSIONS.has(ext);
}

function decodePlainTextBuffer(buffer) {
  if (buffer.includes(0)) {
    return null;
  }

  try {
    return utf8Decoder.decode(buffer).replace(/^\uFEFF/, '');
  } catch {
    return null;
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedPlainTextUpload(file)) {
      const err = new Error('Logbook must be a plain text file.');
      err.statusCode = 400;
      return cb(err);
    }
    return cb(null, true);
  },
});

router.post('/', upload.single('logbook'), (req, res) => {
  const { make, model, badge } = req.body;

  if (
    typeof make !== 'string' ||
    typeof model !== 'string' ||
    typeof badge !== 'string' ||
    !make ||
    !model ||
    !badge
  ) {
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

  const content = decodePlainTextBuffer(req.file.buffer);
  if (content === null) {
    return res.status(400).json({
      error: 'Logbook must be a valid UTF-8 plain text file.',
    });
  }

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
