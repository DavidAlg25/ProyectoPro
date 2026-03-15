import {Router} from 'express';
import {showInvoiceDetail,showInvoiceDetailId,addInvoiceDetail,updateInvoiceDetail,deleteInvoiceDetail} from '../controllers/invoiceDetail.controller.js';

const router=Router();
const apiName='/invoiceDetail';

router.route(apiName)
  .get(showInvoiceDetail)  // Get all InvoiceDetail
  .post(addInvoiceDetail); // Add InvoiceDetail

router.route(`${apiName}/:id`)
  .get(showInvoiceDetailId)  // Get InvoiceDetail by Id
  .put(updateInvoiceDetail)  // Update InvoiceDetail by Id
  .delete(deleteInvoiceDetail); // Delete InvoiceDetail by Id

export default router;