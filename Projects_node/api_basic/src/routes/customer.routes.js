import {Router} from 'express';
import {showCustomer,showCustomerId,addCustomer,updateCustomer,deleteCustomer} from '../controllers/customer.controller.js';

const router=Router();
const apiName='/customer';

router.route(apiName)
  .get(showCustomer) 
  .post(addCustomer);

router.route(`${apiName}/:id`)
  .get(showCustomerId)  
  .put(updateCustomer)  
  .delete(deleteCustomer); 

export default router;