import {Router} from 'express';
import {
  createPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  showPurchaseOrder,
  showPurchaseOrderId,
  updatePurchaseOrder
} from '../controllers/purchase.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/purchase-order';

// =============================================
// RUTAS PARA ADMIN (gestión de órdenes de compra)
// =============================================

// Crear orden de compra con items
router.post('/purchase-order/create',
  verifyToken,
  authorize('admin'),
  createPurchaseOrder
);

// Recibir orden de compra (actualizar inventario)
router.put('/purchase-order/:id/receive',
  verifyToken,
  authorize('admin'),
  receivePurchaseOrder 
);

// Cancelar orden de compra
router.put('/purchase-order/:id/cancel',
  verifyToken,
  authorize('admin'),
  cancelPurchaseOrder
);

// CRUD básico
router.route(apiName)
  .get(verifyToken, authorize('admin'), showPurchaseOrder);

router.route(`${apiName}/:id`)
  .get(verifyToken, authorize('admin'), showPurchaseOrderId)
  .put(verifyToken, authorize('admin'), updatePurchaseOrder);

export default router;