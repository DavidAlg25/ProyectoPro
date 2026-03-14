/**
*Author: 	DIEGO CASALLAS
*Date:		01/01/2026  
*Description:	This file defines the routes for the API user management. It includes routes for creating, retrieving, updating, and deleting API users, as well as routes for user login and token verification. The routes are handled by the corresponding controller functions imported from 'apiUser.controller.js'.
**/
import { Router } from 'express';
import { showApiUser, showApiUserId, addApiUser, updateApiUser, deleteApiUser, loginApiUser,verifyTokenLogin } from '../controllers/apiUser.controller.js';

const router = Router();
const apiName = '/apiUser';

router.route(apiName)
  .get(showApiUser)  // Get all user
  .post(addApiUser); // Add user

router.route('/apiUserLogin')
  .post(loginApiUser); // Login

  router.route('/apiUserVerifyToken')
  .post(verifyTokenLogin); // Verify Token

router.route(`${apiName}/:id`)
  .get(showApiUserId)  // Get user by Id
  .put(updateApiUser)  // Update user by Id
  .delete(deleteApiUser); // Delete user by Id

export default router;