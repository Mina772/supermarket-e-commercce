import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ok } from '../../common/utils/apiResponse';
import { env } from '../../config/env';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  return ok(
    res,
    {
      status: 'ok',
      env: env.NODE_ENV,
      uptime: Math.floor(process.uptime()),
      db: dbState === 1 ? 'connected' : 'disconnected',
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      version: process.env.npm_package_version ?? '1.0.0',
    },
    'Service healthy',
  );
});

router.get('/ready', (_req: Request, res: Response) => {
  const ready = mongoose.connection.readyState === 1;
  return res.status(ready ? 200 : 503).json({ success: ready, ready });
});

export const healthRoutes = router;
