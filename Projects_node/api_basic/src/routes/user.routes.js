import { Router } from 'express';
import { showUser, showUserId, addUser, updateUser, deleteUser } from '../controllers/user.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/user';

// Lectura: admin y vendedor pueden listar y ver detalles (útil para asignar roles, etc.)
router.get(apiName, verifyToken, authorize('admin', 'vendedor'), showUser);
router.get(`${apiName}/:id`, verifyToken, authorize('admin', 'vendedor'), showUserId);

// Escritura: solo admin
router.post(apiName, verifyToken, authorize('admin'), addUser);
router.put(`${apiName}/:id`, verifyToken, authorize('admin'), updateUser);
router.delete(`${apiName}/:id`, verifyToken, authorize('admin'), deleteUser);

export default router;