import {Router} from 'express';
import {
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  showCartItem,
  showCartItemId
} from '../controllers/cart.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize, isClient } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/cart/items';

// =============================================
// RUTAS PARA CLIENTES (sus items)
// =============================================

// Agregar item al carrito
router.post('/cart/add',  
  verifyToken, 
  isClient,
  addToCart
);

// Actualizar cantidad de un item
router.put('/cart/item/:id', 
  verifyToken, 
  isClient,
  updateCartItemQuantity
);

// Eliminar item del carrito
router.delete('/cart/item/:id', 
  verifyToken, 
  isClient,
  removeFromCart
);

// =============================================
// RUTAS PARA ADMIN (gestión de items)
// =============================================

router.route(apiName)
  .get(verifyToken, authorize('admin'), showCartItem);

router.route(`${apiName}/:id`)
  .get(verifyToken, authorize('admin'), showCartItemId);

export default router;