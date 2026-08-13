import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Address } from './address.model';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { created, noContent, ok } from '../../common/utils/apiResponse';
import { NotFoundError } from '../../common/errors/AppError';

const router = Router();
router.use(authenticate);

const schema = z.object({
  label: z.string().max(40).optional(),
  fullName: z.string().min(2),
  phone: z.string().min(6),
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().optional(),
  postalCode: z.string().min(3),
  country: z.string().min(2),
  isDefault: z.boolean().optional(),
});

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) =>
    ok(res, await Address.find({ user: req.user!.id }).sort('-isDefault -createdAt').lean(), 'Addresses'),
  ),
);

router.post(
  '/',
  validate({ body: schema }),
  asyncHandler(async (req: Request, res: Response) => {
    if (req.body.isDefault) await Address.updateMany({ user: req.user!.id }, { isDefault: false });
    const address = await Address.create({ ...req.body, user: req.user!.id });
    return created(res, address, 'Address added');
  }),
);

router.patch(
  '/:id',
  validate({ body: schema.partial() }),
  asyncHandler(async (req: Request, res: Response) => {
    if (req.body.isDefault) await Address.updateMany({ user: req.user!.id }, { isDefault: false });
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user!.id },
      req.body,
      { new: true, runValidators: true },
    );
    if (!address) throw new NotFoundError('Address not found');
    return ok(res, address, 'Address updated');
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user!.id });
    if (!address) throw new NotFoundError('Address not found');
    return noContent(res);
  }),
);

export const addressRoutes = router;
