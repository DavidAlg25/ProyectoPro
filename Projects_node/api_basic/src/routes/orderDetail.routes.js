import {Router} from 'express';
import {
  showOrderDetail,
  showOrderDetailId,
  addOrderDetail,
  updateOrderDetail,
  deleteOrderDetail
} from '../controllers/order.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/order-detail';

// =============================================
// RUTAS SOLO PARA ADMIN
// =============================================

router.route(apiName)
  .get(verifyToken, authorize('admin'), showOrderDetail)
  .post(verifyToken, authorize('admin'), addOrderDetail);

router.route(`${apiName}/:id`)
  .get(verifyToken, authorize('admin'), showOrderDetailId)
  .put(verifyToken, authorize('admin'), updateOrderDetail)
  .delete(verifyToken, authorize('admin'), deleteOrderDetail);

export default router;