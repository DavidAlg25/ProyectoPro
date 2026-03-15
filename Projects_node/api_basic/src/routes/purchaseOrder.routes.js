import {Router} from 'express';
import {showPurchaseOrder,showPurchaseOrderId,addPurchaseOrder,updatePurchaseOrder,deletePurchaseOrder} from '../controllers/purchaseOrder.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router=Router();
const apiName='/purchaseOrder';

router.route(apiName)
  .get(verifyToken, showPurchaseOrder)  // Get all PurchaseOrder
  .post(verifyToken, addPurchaseOrder); // Add PurchaseOrder

router.route(`${apiName}/:id`)
  .get(verifyToken, showPurchaseOrderId)  // Get PurchaseOrder by Id
  .put(verifyToken, updatePurchaseOrder)  // Update PurchaseOrder by Id
  .delete(verifyToken, deletePurchaseOrder); // Delete PurchaseOrder by Id

export default router;