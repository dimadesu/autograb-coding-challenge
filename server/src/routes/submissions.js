import { Router } from 'express';
import multer from 'multer';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

router.post('/', upload.single('file'), (req, res) => {
  const { dropdown1, dropdown2, dropdown3 } = req.body;

  if (!dropdown1 || !dropdown2 || !dropdown3) {
    return res.status(400).json({
      error: 'All three dropdown selections are required.',
    });
  }

  if (!req.file) {
    return res.status(400).json({
      error: 'A file attachment is required.',
    });
  }

  // TODO: Replace with your form & file processing logic.
  // File contents are available as a Buffer at req.file.buffer.
  return res.status(200).json({
    message: 'Form processed successfully.',
    selections: {
      dropdown1,
      dropdown2,
      dropdown3,
    },
    file: {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    },
  });
});

export default router;
