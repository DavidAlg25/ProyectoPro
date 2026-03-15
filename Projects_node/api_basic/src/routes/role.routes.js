import {Router} from 'express';
import {showRole,showRoleId,addRole,updateRole,deleteRole} from '../controllers/role.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router=Router();
const apiName='/role';

router.route(apiName)
  .get(verifyToken, showRole)  // Get all Role
  .post(addRole); // Add Role

router.route(`${apiName}/:id`)
  .get(verifyToken, showRoleId)  // Get Role by Id
  .put(verifyToken, updateRole)  // Update Role by Id
  .delete(verifyToken, deleteRole); // Delete Role by Id

export default router;