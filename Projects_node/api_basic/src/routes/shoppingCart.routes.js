import {Router} from 'express';
import {showShoppingCart,showShoppingCartId,addShoppingCart,updateShoppingCart,deleteShoppingCart} from '../controllers/shoppingCart.controller.js';

const router=Router();
const apiName='/shoppingCart';

router.route(apiName)
  .get(showShoppingCart)  // Get all ShoppingCart
  .post(addShoppingCart); // Add ShoppingCart

router.route(`${apiName}/:id`)
  .get(showShoppingCartId)  // Get ShoppingCart by Id
  .put(updateShoppingCart)  // Update ShoppingCart by Id
  .delete(deleteShoppingCart); // Delete ShoppingCart by Id

export default router;