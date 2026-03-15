import {Router} from 'express';
import {showOrderDetail,showOrderDetailId,addOrderDetail,updateOrderDetail,deleteOrderDetail} from '../controllers/orderDetail.controller.js';

const router=Router();
const apiName='/orderDetail';

router.route(apiName)
  .get(showOrderDetail)  // Get all OrderDetail
  .post(addOrderDetail); // Add OrderDetail

router.route(`${apiName}/:id`)
  .get(showOrderDetailId)  // Get OrderDetail by Id
  .put(updateOrderDetail)  // Update OrderDetail by Id
  .delete(deleteOrderDetail); // Delete OrderDetail by Id

export default router;