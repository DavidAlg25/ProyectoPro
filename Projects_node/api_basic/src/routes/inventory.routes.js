import {Router} from 'express';
import {showInventory,showInventoryId,addInventory,updateInventory,deleteInventory} from '../controllers/inventory.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router=Router();
const apiName='/inventory';

router.route(apiName)
  .get(verifyToken, showInventory)  
  .post(verifyToken, addInventory);

router.route(`${apiName}/:id`)
  .get(verifyToken, showInventoryId)
  .put(verifyToken, updateInventory)
  .delete(verifyToken, deleteInventory); 

export default router;