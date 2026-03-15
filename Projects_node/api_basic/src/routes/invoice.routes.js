import {Router} from 'express';
import {showInvoice,showInvoiceId,addInvoice,updateInvoice,deleteInvoice} from '../controllers/invoice.controller.js';

const router=Router();
const apiName='/invoice';

router.route(apiName)
  .get(showInvoice)  // Get all Invoice
  .post(addInvoice); // Add Invoice

router.route(`${apiName}/:id`)
  .get(showInvoiceId)  // Get Invoice by Id
  .put(updateInvoice)  // Update Invoice by Id
  .delete(deleteInvoice); // Delete Invoice by Id

export default router;