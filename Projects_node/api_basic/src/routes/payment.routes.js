import {Router} from 'express';
import {
  processPayment,
  getMyPayments,
  showPayment,
  showPaymentId,
  addPayment,
  updatePayment,
  deletePayment
} from '../controllers/order.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize, isClient } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/payment';

// =============================================
// RUTAS PARA CLIENTES
// =============================================

// Procesar pago de una orden
router.post('/payment/process',
  verifyToken,
  isClient,
  processPayment
); 

// Ver mis pagos
router.get('/my-payments',
  verifyToken,
  isClient,
  getMyPayments
);

// =============================================
// RUTAS PARA ADMIN (gestión de pagos)
// =============================================

router.route(apiName)
  .get(verifyToken, authorize('admin'), showPayment)
  .post(verifyToken, authorize('admin'), addPayment);

router.route(`${apiName}/:id`)
  .get(verifyToken, authorize('admin'), showPaymentId)
  .put(verifyToken, authorize('admin'), updatePayment)
  .delete(verifyToken, authorize('admin'), deletePayment);

export default router;