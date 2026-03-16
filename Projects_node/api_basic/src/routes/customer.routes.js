import {Router} from 'express';
import {showCustomer,showCustomerId,addCustomer,updateCustomer,deleteCustomer} from '../controllers/customer.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router=Router();
const apiName='/customer';

router.route(apiName)
  .get(verifyToken, showCustomer) 
  .post(addCustomer);

router.route(`${apiName}/:id`)
  .get(verifyToken, showCustomerId)  
  .put(verifyToken, updateCustomer)  
  .delete(verifyToken, deleteCustomer); 

export default router;