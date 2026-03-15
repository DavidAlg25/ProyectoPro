import {Router} from 'express';
import {showOrder,showOrderId,addOrder,updateOrder,deleteOrder} from '../controllers/order.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router=Router();
const apiName='/order';

router.route(apiName)
  .get(verifyToken, showOrder)  // Get all Order
  .post(verifyToken, addOrder); // Add Order

router.route(`${apiName}/:id`)
  .get(verifyToken, showOrderId)  // Get Order by Id
  .put(verifyToken, updateOrder)  // Update Order by Id
  .delete(verifyToken, deleteOrder); // Delete Order by Id

export default router;