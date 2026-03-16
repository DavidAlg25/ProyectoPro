import {Router} from 'express';
import {showSupplier,showSupplierId,addSupplier,updateSupplier,deleteSupplier} from '../controllers/supplier.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router=Router();
const apiName='/supplier';

router.route(apiName)
  .get(verifyToken, showSupplier)  // Get all Supplier
  .post(verifyToken, addSupplier); // Add Supplier

router.route(`${apiName}/:id`)
  .get(verifyToken, showSupplierId)  // Get Supplier by Id
  .put(verifyToken, updateSupplier)  // Update Supplier by Id
  .delete(verifyToken, deleteSupplier); // Delete Supplier by Id

export default router;