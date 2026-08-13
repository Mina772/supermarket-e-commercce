import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodEffects } from 'zod';

type Schema = AnyZodObject | ZodEffects<AnyZodObject>;

/**
 * Validates and *replaces* req.body/query/params with parsed, typed data.
 * Use one schema object with optional `body`, `query`, `params` keys.
 */
export function validate(schemas: { body?: Schema; query?: Schema; params?: Schema }) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) req.body = await schemas.body.parseAsync(req.body);
      if (schemas.query) {
        const parsed = await schemas.query.parseAsync(req.query);
        Object.assign(req.query, parsed);
      }
      if (schemas.params) {
        const parsed = await schemas.params.parseAsync(req.params);
        Object.assign(req.params, parsed);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
