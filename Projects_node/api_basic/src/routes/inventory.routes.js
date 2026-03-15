import {Router} from 'express';
import {showInventory,showInventoryId,addInventory,updateInventory,deleteInventory} from '../controllers/inventory.controller.js';

const router=Router();
const apiName='/inventory';

router.route(apiName)
  .get(showInventory)  
  .post(addInventory);

router.route(`${apiName}/:id`)
  .get(showInventoryId)
  .put(updateInventory)
  .delete(deleteInventory); 

export default router;