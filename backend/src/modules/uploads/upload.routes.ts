import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { env } from '../../config/env';
import { authenticate } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { ok } from '../../common/utils/apiResponse';
import { BadRequestError } from '../../common/errors/AppError';

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

const upload = multer({
  storage,
  limits: { fileSize: env.maxUploadBytes },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      cb(new BadRequestError('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});

const router = Router();
router.use(authenticate);

router.post(
  '/image',
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw new BadRequestError('No file uploaded');
    const url = `/static/${req.file.filename}`;
    return ok(res, { url, filename: req.file.filename, size: req.file.size }, 'Uploaded');
  }),
);

router.post(
  '/images',
  upload.array('files', 8),
  asyncHandler(async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length === 0) throw new BadRequestError('No files uploaded');
    return ok(
      res,
      files.map((f) => ({ url: `/static/${f.filename}`, filename: f.filename, size: f.size })),
      'Uploaded',
    );
  }),
);

export const uploadRoutes = router;
