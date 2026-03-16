import {Router} from 'express';
import {showDocumentType,showDocumentTypeId,addDocumentType,updateDocumentType,deleteDocumentType} from '../controllers/documentType.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router=Router();
const apiName='/documentType';

router.route(apiName)
  .get(verifyToken, showDocumentType)  // Get all DocumentType
  .post(addDocumentType); // Add DocumentType

router.route(`${apiName}/:id`)
  .get(verifyToken, showDocumentTypeId)  // Get DocumentType by Id
  .put(verifyToken, updateDocumentType)  // Update DocumentType by Id
  .delete(verifyToken, deleteDocumentType); // Delete DocumentType by Id

export default router;