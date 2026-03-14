/**
*Author: 	DIEGO CASALLAS
*Date:		01/01/2026   
*Description: This file defines the routes for role management. It includes routes for creating, retrieving, updating, and deleting roles. The routes are handled by the corresponding controller functions imported from 'role.controller.js'.	
**/
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