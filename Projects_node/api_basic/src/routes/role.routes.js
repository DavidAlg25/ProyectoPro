import {Router} from 'express';
import {showRole, showRoleId, addRole, updateRole, deleteRole} from '../controllers/role.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/role';

// Lectura: admin y vendedor pueden ver roles (para asignar en el panel)
router.get(apiName, verifyToken, authorize('admin', 'vendedor'), showRole);
router.get(`${apiName}/:id`, verifyToken, authorize('admin', 'vendedor'), showRoleId);

// Escritura: solo admin
router.post(apiName, verifyToken, authorize('admin'), addRole);
router.put(`${apiName}/:id`, verifyToken, authorize('admin'), updateRole);
router.delete(`${apiName}/:id`, verifyToken, authorize('admin'), deleteRole);

export default router;