import DocumentTypeModel from '../models/documentType.model.js';

export const showDocumentType = async (req, res) => {
  try {
    const documentTypeModel = new DocumentTypeModel();
    documentTypeModel.showDocumentType(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching DocumentTypes", details: error.message });
  }
};

export const showDocumentTypeId = async (req, res) => {
  try {
    const documentTypeModel = new DocumentTypeModel();
    documentTypeModel.showDocumentTypeById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching DocumentType", details: error.message });
  }
};

export const addDocumentType = async (req, res) => {
  try {
    const documentTypeModel = new DocumentTypeModel();
    documentTypeModel.addDocumentType(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding DocumentType", details: error.message });
  }
};

export const updateDocumentType = async (req, res) => {
  try {
    const documentTypeModel = new DocumentTypeModel();
    documentTypeModel.updateDocumentType(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating DocumentType", details: error.message });
  }
};

export const deleteDocumentType = async (req, res) => {
  try {
    const documentTypeModel = new DocumentTypeModel();
    documentTypeModel.deleteDocumentType(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting DocumentType", details: error.message });
  }
};


