import {Router} from 'express';
import {showInventoryMovement,showInventoryMovementId,addInventoryMovement,updateInventoryMovement,deleteInventoryMovement} from '../controllers/inventoryMovement.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router=Router();
const apiName='/inventoryMovement';

router.route(apiName)
  .get(verifyToken, showInventoryMovement)  // Get all InventoryMovement
  .post(verifyToken, addInventoryMovement); // Add InventoryMovement

router.route(`${apiName}/:id`)
  .get(verifyToken, showInventoryMovementId)  // Get InventoryMovement by Id
  .put(verifyToken, updateInventoryMovement)  // Update InventoryMovement by Id
  .delete(verifyToken, deleteInventoryMovement); // Delete InventoryMovement by Id

export default router;