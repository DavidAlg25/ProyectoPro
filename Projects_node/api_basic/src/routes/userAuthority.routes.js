import {Router} from 'express';
import {showUserAuthority, showUserAuthorityId, addUserAuthority, updateUserAuthority, deleteUserAuthority} from '../controllers/userAuthority.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/userAuthority';

// Listar y ver detalles: admin y vendedor pueden ver asignaciones
router.get(apiName, verifyToken, authorize('admin', 'vendedor'), showUserAuthority);
router.get(`${apiName}/:id`, verifyToken, authorize('admin', 'vendedor'), showUserAuthorityId);

// Modificaciones: solo admin
router.post(apiName, verifyToken, authorize('admin'), addUserAuthority);
router.put(`${apiName}/:id`, verifyToken, authorize('admin'), updateUserAuthority);
router.delete(`${apiName}/:id`, verifyToken, authorize('admin'), deleteUserAuthority);

export default router;