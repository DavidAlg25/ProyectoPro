import {Router} from 'express';
import {showPayment,showPaymentId,addPayment,updatePayment,deletePayment} from '../controllers/payment.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router=Router();
const apiName='/payment';

router.route(apiName)
  .get(verifyToken, showPayment)  // Get all Payment
  .post(verifyToken, addPayment); // Add Payment

router.route(`${apiName}/:id`)
  .get(verifyToken, showPaymentId)  // Get Payment by Id
  .put(verifyToken, updatePayment)  // Update Payment by Id
  .delete(verifyToken, deletePayment); // Delete Payment by Id

export default router;