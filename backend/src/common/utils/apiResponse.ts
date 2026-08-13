import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta | Record<string, unknown>;
  timestamp: string;
}

/** Standard success responder used across all controllers. */
export function ok<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: PaginationMeta | Record<string, unknown>,
): Response<ApiEnvelope<T>> {
  const body: ApiEnvelope<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

export function created<T>(res: Response, data: T, message = 'Created'): Response {
  return ok(res, data, message, 201);
}

export function noContent(res: Response): Response {
  return res.status(204).send();
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
