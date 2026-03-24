import {Router} from 'express';
import {
  createOrderFromCart,
  getMyOrders,
  getOrderDetails,
  cancelMyOrder,
  showOrder,
  showOrderId,
  createOrderManual,
  updateOrder
} from '../controllers/order.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize, isClient } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/order';

// =============================================
// RUTAS PARA CLIENTES
// =============================================

// Crear orden desde carrito (checkout)
router.post('/order/checkout',
  verifyToken,
  isClient,
  createOrderFromCart
);

// Ver mis órdenes
router.get('/my-orders',
  verifyToken,
  isClient,
  getMyOrders
);

// Ver detalle de una orden específica
router.get('/my-orders/:id',
  verifyToken,
  isClient,
  getOrderDetails
);

// Cancelar una orden pendiente
router.put('/my-orders/:id/cancel',
  verifyToken,
  isClient,
  cancelMyOrder
);

// =============================================
// RUTAS PARA ADMIN (gestión de órdenes)
// =============================================
router.post('/order/manual', 
  verifyToken,
  authorize('admin'),
  createOrderManual
);

router.route(apiName)
  .get(verifyToken, authorize('admin'), showOrder)

router.route(`${apiName}/:id`)
  .get(verifyToken, authorize('admin'), showOrderId)
  .put(verifyToken, authorize('admin'), updateOrder)

export default router;