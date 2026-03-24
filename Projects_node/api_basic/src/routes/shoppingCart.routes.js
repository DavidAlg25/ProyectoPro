import {Router} from 'express';
import {
  getMyCart,
  clearCart,
  showShoppingCart,
  showShoppingCartId,
  addShoppingCart,
  updateShoppingCart,
  deleteShoppingCart
} from '../controllers/cart.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize, isClient } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/cart';

// =============================================
// RUTAS PARA CLIENTES (su propio carrito)
// =============================================

// Ver mi carrito
router.get('/my-cart', 
  verifyToken, 
  isClient,
  getMyCart
);

// Vaciar mi carrito
router.delete('/my-cart/clear', 
  verifyToken, 
  isClient,
  clearCart
);

// =============================================
// RUTAS PARA ADMIN (gestión de carritos)
// =============================================

router.route(apiName)
  .get(verifyToken, authorize('admin'), showShoppingCart)
  .post(verifyToken, authorize('admin'), addShoppingCart);

router.route(`${apiName}/:id`)
  .get(verifyToken, authorize('admin'), showShoppingCartId)
  .put(verifyToken, authorize('admin'), updateShoppingCart)
  .delete(verifyToken, authorize('admin'), deleteShoppingCart);

export default router;