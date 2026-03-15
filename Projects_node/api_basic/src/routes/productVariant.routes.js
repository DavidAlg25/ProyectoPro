import {Router} from 'express';
import {showProductVariant,showProductVariantId,addProductVariant,updateProductVariant,deleteProductVariant} from '../controllers/productVariant.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router=Router();
const apiName='/variant';

router.route(apiName)
  .get(verifyToken, showProductVariant)  // Get all ProductVariant
  .post(verifyToken, addProductVariant); // Add ProductVariant

router.route(`${apiName}/:id`)
  .get(verifyToken, showProductVariantId)  // Get ProductVariant by Id
  .put(verifyToken, updateProductVariant)  // Update ProductVariant by Id
  .delete(verifyToken, deleteProductVariant); // Delete ProductVariant by Id

export default router;