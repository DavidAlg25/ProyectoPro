import {Router} from 'express';
import {showUserAuthority,showUserAuthorityId,addUserAuthority,updateUserAuthority,deleteUserAuthority} from '../controllers/userAuthority.controller.js';

const router=Router();
const apiName='/userAuthority';

router.route(apiName)
  .get(showUserAuthority)  // Get all UserAuthority
  .post(addUserAuthority); // Add UserAuthority

router.route(`${apiName}/:id`)
  .get(showUserAuthorityId)  // Get UserAuthority by Id
  .put(updateUserAuthority)  // Update UserAuthority by Id
  .delete(deleteUserAuthority); // Delete UserAuthority by Id

export default router;