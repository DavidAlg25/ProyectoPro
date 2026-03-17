import {Router} from 'express';
import {
  showProductVariant,
  showProductVariantId,
  addProductVariant,
  updateProductVariant,
  deleteProductVariant,
  getVariantsByProduct,
  checkVariantAvailability
} from '../controllers/productVariant.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/variant';

// =============================================
// RUTAS PÚBLICAS (No requieren token)
// =============================================
// Estas rutas las puede usar cualquier persona (incluso no logueados)
router.get('/product/:productId/variants', getVariantsByProduct);
router.get('/:id/availability', checkVariantAvailability);

// =============================================
// RUTAS PROTEGIDAS POR ROL
// =============================================

// VER variantes: Todos los roles autenticados pueden ver
// admin, vendedor, bodeguero, cliente (todos ven pero con diferentes datos)
router.get(apiName, 
  verifyToken, 
  showProductVariant
);

router.get(`${apiName}/:id`, 
  verifyToken, 
  showProductVariantId
);

// CREAR variante: SOLO ADMIN
router.post(apiName, 
  verifyToken, 
  authorize('admin'), // Solo admin
  addProductVariant
);

// ACTUALIZAR variante: SOLO ADMIN
router.put(`${apiName}/:id`, 
  verifyToken, 
  authorize('admin'), // Solo admin
  updateProductVariant
);

// ELIMINAR variante: SOLO ADMIN
router.delete(`${apiName}/:id`, 
  verifyToken, 
  authorize('admin'), // Solo admin
  deleteProductVariant
);

export default router;