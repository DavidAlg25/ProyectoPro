import {Router} from 'express';
import {showPurchaseDetail,showPurchaseDetailId,addPurchaseDetail,updatePurchaseDetail,deletePurchaseDetail} from '../controllers/purchaseDetail.controller.js';

const router=Router();
const apiName='/purchaseDetail';

router.route(apiName)
  .get(showPurchaseDetail)  // Get all PurchaseDetail
  .post(addPurchaseDetail); // Add PurchaseDetail

router.route(`${apiName}/:id`)
  .get(showPurchaseDetailId)  // Get PurchaseDetail by Id
  .put(updatePurchaseDetail)  // Update PurchaseDetail by Id
  .delete(deletePurchaseDetail); // Delete PurchaseDetail by Id

export default router;