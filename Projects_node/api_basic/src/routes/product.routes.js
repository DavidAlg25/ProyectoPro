import {Router} from 'express';
import {showProduct,showProductId,addProduct,updateProduct,deleteProduct} from '../controllers/product.controller.js';

const router=Router();
const apiName='/product';

router.route(apiName)
  .get(showProduct)  // Get all Product
  .post(addProduct); // Add Product

router.route(`${apiName}/:id`)
  .get(showProductId)  // Get Product by Id
  .put(updateProduct)  // Update Product by Id
  .delete(deleteProduct); // Delete Product by Id

export default router;