import {Router} from 'express';
import {
  showInvoiceDetail,
  showInvoiceDetailId,
  addInvoiceDetail,
  updateInvoiceDetail,
  deleteInvoiceDetail
} from '../controllers/invoice.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/invoice-detail';

// =============================================
// RUTAS SOLO PARA ADMIN
// =============================================

router.route(apiName)
  .get(verifyToken, authorize('admin'), showInvoiceDetail)
  .post(verifyToken, authorize('admin'), addInvoiceDetail);

router.route(`${apiName}/:id`)
  .get(verifyToken, authorize('admin'), showInvoiceDetailId)
  .put(verifyToken, authorize('admin'), updateInvoiceDetail)
  .delete(verifyToken, authorize('admin'), deleteInvoiceDetail);

export default router;