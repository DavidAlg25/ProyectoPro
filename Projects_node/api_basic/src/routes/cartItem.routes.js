import {Router} from 'express';
import {showCartItem,showCartItemId,addCartItem,updateCartItem,deleteCartItem} from '../controllers/cartItem.controller.js';

const router=Router();
const apiName='/cartItem';

router.route(apiName)
  .get(showCartItem)  // Get all CartItem
  .post(addCartItem); // Add CartItem

router.route(`${apiName}/:id`)
  .get(showCartItemId)  // Get CartItem by Id
  .put(updateCartItem)  // Update CartItem by Id
  .delete(deleteCartItem); // Delete CartItem by Id

export default router;