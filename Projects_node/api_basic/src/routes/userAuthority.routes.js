import {Router} from 'express';
import {showUserAuthority,showUserAuthorityId,addUserAuthority,updateUserAuthority,deleteUserAuthority} from '../controllers/userAuthority.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router=Router();
const apiName='/userAuthority';

router.route(apiName)
  .get(verifyToken, showUserAuthority)  // Get all UserAuthority
  .post(verifyToken, addUserAuthority); // Add UserAuthority

router.route(`${apiName}/:id`)
  .get(verifyToken, showUserAuthorityId)  // Get UserAuthority by Id
  .put(verifyToken, updateUserAuthority)  // Update UserAuthority by Id
  .delete(verifyToken, deleteUserAuthority); // Delete UserAuthority by Id

export default router;