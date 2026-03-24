import {Router} from 'express';
import {showCustomer, showCustomerId, addCustomer, updateCustomer, deleteCustomer} from '../controllers/customer.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
const apiName = '/customer';

// Admin y vendedor pueden listar y crear clientes
router.route(apiName)
  .get(verifyToken, authorize('admin', 'vendedor'), showCustomer)
  .post(verifyToken, authorize('admin'), addCustomer);   // <-- agregado verifyToken y authorize

// Ver detalle, actualizar y eliminar
router.route(`${apiName}/:id`)
  .get(verifyToken, authorize('admin', 'vendedor'), showCustomerId)   // pueden ver cualquier cliente
  .put(verifyToken, authorize('admin'), updateCustomer)               // solo admin actualiza
  .delete(verifyToken, authorize('admin'), deleteCustomer);           // solo admin elimina

export default router;