import {Router} from 'express';
import {showCategory,showCategoryId,addCategory,updateCategory,deleteCategory} from '../controllers/category.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router=Router();
const apiName='/category';

router.route(apiName)
  .get(verifyToken, showCategory)  // Get all Category
  .post(addCategory); // Add Category

router.route(`${apiName}/:id`)
  .get(verifyToken, showCategoryId)  // Get Category by Id
  .put(verifyToken, updateCategory)  // Update Category by Id
  .delete(verifyToken, deleteCategory); // Delete Category by Id

export default router;