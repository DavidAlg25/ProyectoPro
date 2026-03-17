import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize, isClient } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/auth';

// =============================================
// RUTAS PÚBLICAS (No requieren token)
// =============================================
router.post(`${apiName}/register`, authController.register);
router.post(`${apiName}/login`, authController.login);
router.post(`${apiName}/logout`, authController.logout);
router.get(`${apiName}/activate/:token`, authController.activateAccount);

// =============================================
// RUTAS PROTEGIDAS (Requieren token)
// =============================================

// Perfil - Accesible por cualquier usuario autenticado
router.get(`${apiName}/profile`, 
  verifyToken, 
  authController.getProfile
);

// Actualizar perfil - CLIENTES y ADMIN pueden actualizar su perfil
router.put(`${apiName}/profile`, 
  verifyToken, 
  isClient, 
  authController.updateProfile
);

export default router;