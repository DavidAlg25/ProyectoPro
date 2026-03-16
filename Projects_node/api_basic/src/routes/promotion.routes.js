import {Router} from 'express';
import {showPromotion,showPromotionId,addPromotion,updatePromotion,deletePromotion} from '../controllers/promotion.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router=Router();
const apiName='/promotion';

router.route(apiName)
  .get(verifyToken, showPromotion)  // Get all Promotion
  .post(addPromotion); // Add Promotion

router.route(`${apiName}/:id`)
  .get(verifyToken, showPromotionId)  // Get Promotion by Id
  .put(verifyToken, updatePromotion)  // Update Promotion by Id
  .delete(verifyToken, deletePromotion); // Delete Promotion by Id

export default router;