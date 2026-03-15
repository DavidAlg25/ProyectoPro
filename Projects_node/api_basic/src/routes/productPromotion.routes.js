import {Router} from 'express';
import {showProductPromotion,showProductPromotionId,addProductPromotion,updateProductPromotion,deleteProductPromotion} from '../controllers/productPromotion.controller.js';

const router=Router();
const apiName='/productPromotion';

router.route(apiName)
  .get(showProductPromotion)  // Get all ProductPromotion
  .post(addProductPromotion); // Add ProductPromotion

router.route(`${apiName}/:id`)
  .get(showProductPromotionId)  // Get ProductPromotion by Id
  .put(updateProductPromotion)  // Update ProductPromotion by Id
  .delete(deleteProductPromotion); // Delete ProductPromotion by Id

export default router;