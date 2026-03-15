import {Router} from 'express';
import {showRole,showRoleId,addRole,updateRole,deleteRole} from '../controllers/role.controller.js';

const router=Router();
const apiName='/role';

router.route(apiName)
  .get(showRole)  // Get all Role
  .post(addRole); // Add Role

router.route(`${apiName}/:id`)
  .get(showRoleId)  // Get Role by Id
  .put(updateRole)  // Update Role by Id
  .delete(deleteRole); // Delete Role by Id

export default router;