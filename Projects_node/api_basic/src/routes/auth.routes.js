import { Router } from 'express';
import authController from '../controllers/auth.controller.js';

const router = Router();
const apiName = '/auth';

// Rutas públicas
router.post(`${apiName}/login`, authController.login);
router.post(`${apiName}/logout`, authController.logout);

export default router;