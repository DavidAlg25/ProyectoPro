import {Router} from 'express';
import {showOrderDetail,showOrderDetailId,addOrderDetail,updateOrderDetail,deleteOrderDetail} from '../controllers/orderDetail.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router=Router();
const apiName='/orderDetail';

router.route(apiName)
  .get(verifyToken, showOrderDetail)  // Get all OrderDetail
  .post(verifyToken, addOrderDetail); // Add OrderDetail

router.route(`${apiName}/:id`)
  .get(verifyToken, showOrderDetailId)  // Get OrderDetail by Id
  .put(verifyToken, updateOrderDetail)  // Update OrderDetail by Id
  .delete(verifyToken, deleteOrderDetail); // Delete OrderDetail by Id

export default router;