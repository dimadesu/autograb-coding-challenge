import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { vehicleRepository } from '../repositories/vehicles.ts';

const submissionBodySchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  badge: z.string().min(1),
});

interface HttpError extends Error {
  statusCode?: number;
}

export interface SubmissionResponse {
  make: string;
  model: string;
  badge: string;
  logbook: {
    fileName: string;
    mimeType: string;
    size: number;
    content: string;
  };
}

const router = Router();

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const GENERIC_MIME_TYPES = new Set(['', 'application/octet-stream']);
const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

function isAllowedPlainTextUpload(file: Express.Multer.File): boolean {
  const mime = (file.mimetype || '').toLowerCase();
  return mime.startsWith('text/') || GENERIC_MIME_TYPES.has(mime);
}

function decodePlainTextBuffer(buffer: Buffer): string | null {
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
      const err: HttpError = new Error('Logbook must be a plain text file.');
      err.statusCode = 400;
      cb(err);
      return;
    }
    cb(null, true);
  },
});

router.post('/', upload.single('logbook'), async (req, res) => {
  const parsedBody = submissionBodySchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({
      error: 'Make, model, and badge are all required.',
    });
    return;
  }

  const { make, model, badge } = parsedBody.data;

  if (!(await vehicleRepository.isValidSelection(make, model, badge))) {
    res.status(400).json({
      error: 'Invalid make, model, and badge combination.',
    });
    return;
  }

  if (!req.file) {
    res.status(400).json({
      error: 'A plain text service logbook file is required.',
    });
    return;
  }

  const content = decodePlainTextBuffer(req.file.buffer);
  if (content === null) {
    res.status(400).json({
      error: 'Logbook must be a valid UTF-8 plain text file.',
    });
    return;
  }

  const response: SubmissionResponse = {
    make,
    model,
    badge,
    logbook: {
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      content,
    },
  };

  res.status(200).json(response);
});

export default router;
