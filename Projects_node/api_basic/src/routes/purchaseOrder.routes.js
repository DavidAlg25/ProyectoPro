import {Router} from 'express';
import {showPurchaseOrder,showPurchaseOrderId,addPurchaseOrder,updatePurchaseOrder,deletePurchaseOrder} from '../controllers/purchaseOrder.controller.js';

const router=Router();
const apiName='/purchaseOrder';

router.route(apiName)
  .get(showPurchaseOrder)  // Get all PurchaseOrder
  .post(addPurchaseOrder); // Add PurchaseOrder

router.route(`${apiName}/:id`)
  .get(showPurchaseOrderId)  // Get PurchaseOrder by Id
  .put(updatePurchaseOrder)  // Update PurchaseOrder by Id
  .delete(deletePurchaseOrder); // Delete PurchaseOrder by Id

export default router;