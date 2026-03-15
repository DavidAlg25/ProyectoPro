import {Router} from 'express';
import {showPurchaseDetail,showPurchaseDetailId,addPurchaseDetail,updatePurchaseDetail,deletePurchaseDetail} from '../controllers/purchaseDetail.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router=Router();
const apiName='/purchaseDetail';

router.route(apiName)
  .get(verifyToken, showPurchaseDetail)  // Get all PurchaseDetail
  .post(verifyToken, addPurchaseDetail); // Add PurchaseDetail

router.route(`${apiName}/:id`)
  .get(verifyToken, showPurchaseDetailId)  // Get PurchaseDetail by Id
  .put(verifyToken, updatePurchaseDetail)  // Update PurchaseDetail by Id
  .delete(verifyToken, deletePurchaseDetail); // Delete PurchaseDetail by Id

export default router;