import express from 'express';
import multer from 'multer';
import vehiclesRouter from './routes/vehicles.js';
import submissionsRouter from './routes/submissions.js';

const app = express();

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/vehicles', vehiclesRouter);
app.use('/api/submissions', submissionsRouter);

// Centralized error handler (including multer upload errors)
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
});

export default app;
