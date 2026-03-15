import {Router} from 'express';
import {showShoppingCart,showShoppingCartId,addShoppingCart,updateShoppingCart,deleteShoppingCart} from '../controllers/shoppingCart.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router=Router();
const apiName='/shoppingCart';

router.route(apiName)
  .get(verifyToken, showShoppingCart)  // Get all ShoppingCart
  .post(verifyToken, addShoppingCart); // Add ShoppingCart

router.route(`${apiName}/:id`)
  .get(verifyToken, showShoppingCartId)  // Get ShoppingCart by Id
  .put(verifyToken, updateShoppingCart)  // Update ShoppingCart by Id
  .delete(verifyToken, deleteShoppingCart); // Delete ShoppingCart by Id

export default router;