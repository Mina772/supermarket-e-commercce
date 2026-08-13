import { Router, Request, Response } from 'express';
import { Notification } from './notification.model';
import { authenticate } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { buildPaginationMeta, noContent, ok } from '../../common/utils/apiResponse';
import { parseQueryOptions } from '../../common/utils/pagination';
import { NotFoundError } from '../../common/errors/AppError';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const options = parseQueryOptions(req);
    const filter = { user: req.user!.id };
    const [items, total, unread] = await Promise.all([
      Notification.find(filter).sort(options.sort).skip(options.skip).limit(options.limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, isRead: false }),
    ]);
    return ok(res, items, 'Notifications', 200, {
      ...buildPaginationMeta(options.page, options.limit, total),
      unread,
    });
  }),
);

router.patch(
  '/:id/read',
  asyncHandler(async (req: Request, res: Response) => {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user!.id },
      { isRead: true },
      { new: true },
    );
    if (!n) throw new NotFoundError('Notification not found');
    return ok(res, n, 'Marked as read');
  }),
);

router.patch(
  '/read-all',
  asyncHandler(async (req: Request, res: Response) => {
    await Notification.updateMany({ user: req.user!.id, isRead: false }, { isRead: true });
    return ok(res, null, 'All notifications marked as read');
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const n = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user!.id });
    if (!n) throw new NotFoundError('Notification not found');
    return noContent(res);
  }),
);

export const notificationRoutes = router;
