import {Router} from 'express';
import {showOrder,showOrderId,addOrder,updateOrder,deleteOrder} from '../controllers/order.controller.js';

const router=Router();
const apiName='/order';

router.route(apiName)
  .get(showOrder)  // Get all Order
  .post(addOrder); // Add Order

router.route(`${apiName}/:id`)
  .get(showOrderId)  // Get Order by Id
  .put(updateOrder)  // Update Order by Id
  .delete(deleteOrder); // Delete Order by Id

export default router;