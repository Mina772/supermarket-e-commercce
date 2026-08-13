import { Request } from 'express';

export interface QueryOptions {
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
  search?: string;
}

const MAX_LIMIT = 100;

/**
 * Parses standard list query parameters:
 *   ?page=1&limit=20&sort=-createdAt,price&search=milk
 * Sort accepts comma-separated fields; a leading '-' means descending.
 */
export function parseQueryOptions(req: Request, defaultSort = '-createdAt'): QueryOptions {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
  const rawLimit = Number.parseInt(String(req.query.limit ?? '20'), 10) || 20;
  const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit));
  const skip = (page - 1) * limit;

  const sortParam = String(req.query.sort ?? defaultSort);
  const sort: Record<string, 1 | -1> = {};
  for (const field of sortParam.split(',').map((f) => f.trim()).filter(Boolean)) {
    if (field.startsWith('-')) sort[field.slice(1)] = -1;
    else sort[field] = 1;
  }
  if (Object.keys(sort).length === 0) sort.createdAt = -1;

  const search = req.query.search ? String(req.query.search).trim() : undefined;

  return { page, limit, skip, sort, ...(search ? { search } : {}) };
}

/** Escapes user input before using it inside a MongoDB $regex. */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
