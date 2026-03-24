import {Router} from 'express';
import dashboardController from '../controllers/dashboard.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();

// =============================================
// DASHBOARD PRINCIPAL
// =============================================
// Estadísticas generales para el panel
router.get('/dashboard/stats',  
  verifyToken, 
  authorize('admin', 'vendedor', 'bodeguero'),
  dashboardController.getDashboardStats
);

// =============================================
// REPORTES ESPECÍFICOS
// =============================================

// Reporte de ventas (con filtros por fecha)
router.get('/reports/sales',
  verifyToken,
  authorize('admin'),
  dashboardController.getSalesReport
);

// Reporte de inventario (estado actual)
router.get('/reports/inventory',
  verifyToken,
  authorize('admin', 'bodeguero'),
  dashboardController.getInventoryReport
);

// Reporte de clientes (top compradores, estado)
router.get('/reports/customers',
  verifyToken,
  authorize('admin'),
  dashboardController.getCustomersReport
);

// Reporte de proveedores (historial de compras)
router.get('/reports/suppliers',
  verifyToken,
  authorize('admin'),
  dashboardController.getSuppliersReport
);

// Reporte de productos (rendimiento)
router.get('/report/product',
  verifyToken,
  authorize('admin'),
  dashboardController.getProductsReport
);

// =============================================
// AUDITORÍA
// =============================================
// Log de actividades (con filtros)
router.get('/audit/logs',
  verifyToken,
  authorize('admin'),
  dashboardController.getAuditLog
);

// =============================================
// EXPORTACIÓN DE REPORTES
// =============================================
// Exportar reportes a CSV/Excel (formato JSON por ahora)
router.get('/reports/export',
  verifyToken,
  authorize('admin'),
  dashboardController.exportReport
);

export default router;