import {Router} from 'express';
import {showInvoice,showInvoiceId,addInvoice,updateInvoice,deleteInvoice} from '../controllers/invoice.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router=Router();
const apiName='/invoice';

router.route(apiName)
  .get(verifyToken, showInvoice)  // Get all Invoice
  .post(verifyToken, addInvoice); // Add Invoice

router.route(`${apiName}/:id`)
  .get(verifyToken, showInvoiceId)  // Get Invoice by Id
  .put(verifyToken, updateInvoice)  // Update Invoice by Id
  .delete(verifyToken, deleteInvoice); // Delete Invoice by Id

export default router;