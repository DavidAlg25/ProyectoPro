import {Router} from 'express';
import {
  showPurchaseDetail,
  showPurchaseDetailId,
  addPurchaseDetail,
  updatePurchaseDetail,
  deletePurchaseDetail
} from '../controllers/purchase.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/purchase-detail'; 

// =============================================
// RUTAS SOLO PARA ADMIN
// =============================================

router.route(apiName)
  .get(verifyToken, authorize('admin'), showPurchaseDetail)
  .post(verifyToken, authorize('admin'), addPurchaseDetail);

router.route(`${apiName}/:id`)
  .get(verifyToken, authorize('admin'), showPurchaseDetailId)
  .put(verifyToken, authorize('admin'), updatePurchaseDetail)
  .delete(verifyToken, authorize('admin'), deletePurchaseDetail);

export default router;