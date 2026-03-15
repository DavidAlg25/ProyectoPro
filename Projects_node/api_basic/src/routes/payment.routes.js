import {Router} from 'express';
import {showPayment,showPaymentId,addPayment,updatePayment,deletePayment} from '../controllers/payment.controller.js';

const router=Router();
const apiName='/payment';

router.route(apiName)
  .get(showPayment)  // Get all Payment
  .post(addPayment); // Add Payment

router.route(`${apiName}/:id`)
  .get(showPaymentId)  // Get Payment by Id
  .put(updatePayment)  // Update Payment by Id
  .delete(deletePayment); // Delete Payment by Id

export default router;