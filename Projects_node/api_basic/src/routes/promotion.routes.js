import {Router} from 'express';
import {
  getActivePromotions,
  getPromotionsWithStats,
  showPromotion,
  showPromotionId,
  addPromotion,
  updatePromotion,
  deletePromotion
} from '../controllers/promotion.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/promotion';

// =============================================
// RUTAS PÚBLICAS (catálogo)
// =============================================
router.get('/promotions/active', getActivePromotions);

// =============================================
// RUTAS PARA ADMIN
// =============================================

// Promociones con estadísticas
router.get('/promotions/stats',
  verifyToken,
  authorize('admin'),
  getPromotionsWithStats
);

router.route(apiName)
  .get(verifyToken, authorize('admin'), showPromotion)
  .post(verifyToken, authorize('admin'), addPromotion);

router.route(`${apiName}/:id`)
  .get(verifyToken, authorize('admin'), showPromotionId)
  .put(verifyToken, authorize('admin'), updatePromotion)
  .delete(verifyToken, authorize('admin'), deletePromotion);

export default router;