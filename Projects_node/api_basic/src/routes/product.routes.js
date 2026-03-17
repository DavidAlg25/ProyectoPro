import {Router} from 'express';
import {
  showProduct, 
  showProductId, 
  addProduct, 
  updateProduct, 
  deleteProduct,
  toggleProductStatus,
  getCatalog
} from '../controllers/product.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/product';

// =============================================
// RUTAS PÚBLICAS (No requieren token)
// =============================================
// El catálogo lo puede ver cualquier persona (incluso no logueados)
router.get('/catalog', getCatalog);

// =============================================
// RUTAS PROTEGIDAS POR ROL
// =============================================

// VER productos: Todos los roles autenticados pueden ver
// admin, vendedor, bodeguero, cliente (todos ven pero con filtros)
router.get(apiName, 
  verifyToken, 
  showProduct
);

router.get(`${apiName}/:id`, 
  verifyToken, 
  showProductId
);

// CREAR producto: SOLO ADMIN
router.post(apiName, 
  verifyToken, 
  authorize('admin'),
  addProduct
);

// ACTUALIZAR producto: SOLO ADMIN
router.put(`${apiName}/:id`, 
  verifyToken, 
  authorize('admin'),
  updateProduct
);

// ELIMINAR producto: SOLO ADMIN
router.delete(`${apiName}/:id`, 
  verifyToken, 
  authorize('admin'),
  deleteProduct
);

// CAMBIAR ESTADO producto: SOLO ADMIN
router.patch(`${apiName}/:id/status`, 
  verifyToken, 
  authorize('admin'),
  toggleProductStatus
);

export default router;