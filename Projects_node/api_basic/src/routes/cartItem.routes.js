import {Router} from 'express';
import {showCartItem,showCartItemId,addCartItem,updateCartItem,deleteCartItem} from '../controllers/cartItem.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router=Router();
const apiName='/cartItem';

router.route(apiName)
  .get(verifyToken, showCartItem)  // Get all CartItem
  .post(verifyToken, addCartItem); // Add CartItem

router.route(`${apiName}/:id`)
  .get(verifyToken, showCartItemId)  // Get CartItem by Id
  .put(verifyToken, updateCartItem)  // Update CartItem by Id
  .delete(verifyToken, deleteCartItem); // Delete CartItem by Id

export default router;