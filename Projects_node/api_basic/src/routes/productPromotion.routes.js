import {Router} from 'express';
import {
  bulkAssignPromotions,
  getVariantPromotions,
  showProductPromotion,
  showProductPromotionId,
  addProductPromotion,
  updateProductPromotion,
  deleteProductPromotion
} from '../controllers/promotion.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/product-promotion';

// =============================================
// RUTAS PÚBLICAS (catálogo)
// =============================================
router.get('/variant/:variantId/promotions', getVariantPromotions);

// =============================================
// RUTAS PARA ADMIN
// =============================================

// Asignación masiva
router.post('/promotions/bulk-assign',
  verifyToken,
  authorize('admin'),
  bulkAssignPromotions
);

router.route(apiName)
  .get(verifyToken, authorize('admin'), showProductPromotion)
  .post(verifyToken, authorize('admin'), addProductPromotion);

router.route(`${apiName}/:id`)
  .get(verifyToken, authorize('admin'), showProductPromotionId)
  .put(verifyToken, authorize('admin'), updateProductPromotion)
  .delete(verifyToken, authorize('admin'), deleteProductPromotion);

export default router;