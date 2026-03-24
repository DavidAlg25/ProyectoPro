import {Router} from 'express';
import {
  generateInvoiceFromOrder,
  getMyInvoices,
  getInvoiceDetails,
  cancelInvoice,
  showInvoice,
  showInvoiceId,
} from '../controllers/invoice.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize, isClient } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/invoice';

// =============================================
// RUTAS PARA CLIENTES
// =============================================

// Generar factura desde orden pagada
router.post('/invoice/generate',
  verifyToken,
  isClient,
  generateInvoiceFromOrder
);

// Ver mis facturas
router.get('/my-invoices',
  verifyToken,
  isClient,
  getMyInvoices
);

// Ver detalle de una factura específica
router.get('/my-invoices/:id',
  verifyToken,
  isClient,
  getInvoiceDetails
);

// =============================================
// RUTAS PARA ADMIN (gestión de facturas)
// =============================================

router.route(apiName)
  .get(verifyToken, authorize('admin'), showInvoice);

router.route(`${apiName}/:id`)
  .get(verifyToken, authorize('admin'), showInvoiceId);

// Anular factura (solo admin)
router.put('/invoice/:id/cancel',
  verifyToken,
  authorize('admin'),
  cancelInvoice
);

export default router;