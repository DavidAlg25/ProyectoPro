import {Router} from 'express';
import {showProduct,showProductId,addProduct,updateProduct,deleteProduct} from '../controllers/product.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router=Router();
const apiName='/product';

router.route(apiName)
  .get(verifyToken, showProduct)  // Get all Product
  .post(verifyToken, addProduct); // Add Product

router.route(`${apiName}/:id`)
  .get(verifyToken, showProductId)  // Get Product by Id
  .put(verifyToken, updateProduct)  // Update Product by Id
  .delete(verifyToken, deleteProduct); // Delete Product by Id

export default router;