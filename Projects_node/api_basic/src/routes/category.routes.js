import {Router} from 'express';
import {
  showCategory,
  showCategoryId,
  addCategory,
  updateCategory,
  deleteCategory,
  getProductsByCategory,
  getActiveCategories
} from '../controllers/category.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/category';

// =============================================
// RUTAS PÚBLICAS (No requieren token)
// =============================================
// Categorías activas para el catálogo público
router.get('/active', getActiveCategories);
router.get('/:id/products', getProductsByCategory);

// =============================================
// RUTAS PROTEGIDAS POR ROL
// =============================================

// VER categorías: Todos los roles autenticados pueden ver
router.get(apiName, 
  verifyToken, 
  showCategory
);

router.get(`${apiName}/:id`, 
  verifyToken, 
  showCategoryId
);

// CREAR categoría: SOLO ADMIN
router.post(apiName, 
  verifyToken, 
  authorize('admin'),
  addCategory
);

// ACTUALIZAR categoría: SOLO ADMIN
router.put(`${apiName}/:id`, 
  verifyToken, 
  authorize('admin'),
  updateCategory
);

// ELIMINAR categoría: SOLO ADMIN
router.delete(`${apiName}/:id`, 
  verifyToken, 
  authorize('admin'),
  deleteCategory
);

export default router;