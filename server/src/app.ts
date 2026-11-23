import express, { type ErrorRequestHandler } from 'express';
import multer from 'multer';
import vehiclesRouter from './routes/vehicles.ts';
import submissionsRouter from './routes/submissions.ts';

const app = express();

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/vehicles', vehiclesRouter);
app.use('/api/submissions', submissionsRouter);

// Centralized error handler (including multer upload errors)
const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (
    err instanceof Error &&
    'statusCode' in err &&
    typeof err.statusCode === 'number'
  ) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};

app.use(errorHandler);

export default app;
