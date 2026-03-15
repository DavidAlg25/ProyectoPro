import {Router} from 'express';
import {showProductPromotion,showProductPromotionId,addProductPromotion,updateProductPromotion,deleteProductPromotion} from '../controllers/productPromotion.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router=Router();
const apiName='/productPromotion';

router.route(apiName)
  .get(verifyToken, showProductPromotion)  // Get all ProductPromotion
  .post(verifyToken, addProductPromotion); // Add ProductPromotion

router.route(`${apiName}/:id`)
  .get(verifyToken, showProductPromotionId)  // Get ProductPromotion by Id
  .put(verifyToken, updateProductPromotion)  // Update ProductPromotion by Id
  .delete(verifyToken, deleteProductPromotion); // Delete ProductPromotion by Id

export default router;