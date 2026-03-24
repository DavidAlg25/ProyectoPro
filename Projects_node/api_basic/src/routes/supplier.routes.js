import {Router} from 'express';
import {
  getSuppliersWithStats,
  showSupplier,
  showSupplierId,
  addSupplier,
  updateSupplier,
  deleteSupplier
} from '../controllers/purchase.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/supplier';

// =============================================
// RUTAS PARA ADMIN (gestión de proveedores)
// =============================================

// Proveedores con estadísticas
router.get('/suppliers/stats',
  verifyToken,
  authorize('admin'),
  getSuppliersWithStats
);

router.route(apiName)
  .get(verifyToken, authorize('admin'), showSupplier)
  .post(verifyToken, authorize('admin'), addSupplier); 

router.route(`${apiName}/:id`)
  .get(verifyToken, authorize('admin'), showSupplierId)
  .put(verifyToken, authorize('admin'), updateSupplier)
  .delete(verifyToken, authorize('admin'), deleteSupplier);

export default router;