import {Router} from 'express';
import {showInvoiceDetail,showInvoiceDetailId,addInvoiceDetail,updateInvoiceDetail,deleteInvoiceDetail} from '../controllers/invoiceDetail.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router=Router();
const apiName='/invoiceDetail';

router.route(apiName)
  .get(verifyToken, showInvoiceDetail)  // Get all InvoiceDetail
  .post(verifyToken, addInvoiceDetail); // Add InvoiceDetail

router.route(`${apiName}/:id`)
  .get(verifyToken, showInvoiceDetailId)  // Get InvoiceDetail by Id
  .put(verifyToken, updateInvoiceDetail)  // Update InvoiceDetail by Id
  .delete(verifyToken, deleteInvoiceDetail); // Delete InvoiceDetail by Id

export default router;