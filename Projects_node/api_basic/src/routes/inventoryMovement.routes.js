import {Router} from 'express';
import {
  getMovementsWithFilters,
  showInventoryMovement,
  showInventoryMovementId
} from '../controllers/inventory.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/inventory-movement';

// =============================================
// RUTAS PARA BODEGUERO/ADMIN
// =============================================

// Ver movimientos con filtros
router.get('/movements/filter',
  verifyToken,
  authorize('admin', 'bodeguero'),
  getMovementsWithFilters
);

// =============================================
// CRUD COMPLETO (solo admin)
// =============================================

router.route(apiName)
  .get(verifyToken, authorize('admin'), showInventoryMovement);

router.route(`${apiName}/:id`)
  .get(verifyToken, authorize('admin'), showInventoryMovementId);

export default router;