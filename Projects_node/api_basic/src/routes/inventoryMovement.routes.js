import {Router} from 'express';
import {showInventoryMovement,showInventoryMovementId,addInventoryMovement,updateInventoryMovement,deleteInventoryMovement} from '../controllers/inventoryMovement.controller.js';

const router=Router();
const apiName='/inventoryMovement';

router.route(apiName)
  .get(showInventoryMovement)  // Get all InventoryMovement
  .post(addInventoryMovement); // Add InventoryMovement

router.route(`${apiName}/:id`)
  .get(showInventoryMovementId)  // Get InventoryMovement by Id
  .put(updateInventoryMovement)  // Update InventoryMovement by Id
  .delete(deleteInventoryMovement); // Delete InventoryMovement by Id

export default router;