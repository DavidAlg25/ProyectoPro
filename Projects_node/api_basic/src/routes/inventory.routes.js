import {Router} from 'express';
import {
  getInventoryWithAlerts,
  restockInventory,
  showInventory,
  showInventoryId
} from '../controllers/inventory.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/inventory';

// =============================================
// RUTAS PARA BODEGUERO/ADMIN
// =============================================

// Ver inventario con alertas (bajo stock, exceso)
router.get('/inventory/alerts',
  verifyToken,
  authorize('admin', 'bodeguero'),
  getInventoryWithAlerts
);

// Reabastecer stock
router.post('/inventory/restock',
  verifyToken,
  authorize('admin', 'bodeguero'),
  restockInventory
);

// =============================================
// CRUD COMPLETO (solo admin)
// =============================================

router.route(apiName)
  .get(verifyToken, authorize('admin'), showInventory);

router.route(`${apiName}/:id`)
  .get(verifyToken, authorize('admin'), showInventoryId);

export default router;