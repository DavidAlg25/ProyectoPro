import {Router} from 'express';
import {showProductVariant,showProductVariantId,addProductVariant,updateProductVariant,deleteProductVariant} from '../controllers/productVariant.controller.js';

const router=Router();
const apiName='/productVariant';

router.route(apiName)
  .get(showProductVariant)  // Get all ProductVariant
  .post(addProductVariant); // Add ProductVariant

router.route(`${apiName}/:id`)
  .get(showProductVariantId)  // Get ProductVariant by Id
  .put(updateProductVariant)  // Update ProductVariant by Id
  .delete(deleteProductVariant); // Delete ProductVariant by Id

export default router;