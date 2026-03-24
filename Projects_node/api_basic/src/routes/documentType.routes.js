import {Router} from 'express';
import {showDocumentType, showDocumentTypeId, addDocumentType, updateDocumentType, deleteDocumentType} from '../controllers/documentType.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/documentType';

// Lectura: admin y vendedor pueden ver tipos de documento (para usarlos al crear cliente)
router.get(apiName, verifyToken, authorize('admin', 'vendedor'), showDocumentType);
router.get(`${apiName}/:id`, verifyToken, authorize('admin', 'vendedor'), showDocumentTypeId);

// Escritura: solo admin
router.post(apiName, verifyToken, authorize('admin'), addDocumentType);
router.put(`${apiName}/:id`, verifyToken, authorize('admin'), updateDocumentType);
router.delete(`${apiName}/:id`, verifyToken, authorize('admin'), deleteDocumentType);

export default router;