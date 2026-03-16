import SupplierModel from '../models/supplier.model.js';

export const showSupplier = async (req, res) => {
  try {
    const supplierModel = new SupplierModel();
    supplierModel.showSupplier(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Suppliers", details: error.message });
  }
};

export const showSupplierId = async (req, res) => {
  try {
    const supplierModel = new SupplierModel();
    supplierModel.showSupplierById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Supplier", details: error.message });
  }
};

export const addSupplier = async (req, res) => {
  try {
    const supplierModel = new SupplierModel();
    supplierModel.addSupplier(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding Supplier", details: error.message });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const supplierModel = new SupplierModel();
    supplierModel.updateSupplier(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating Supplier", details: error.message });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const supplierModel = new SupplierModel();
    supplierModel.deleteSupplier(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting Supplier", details: error.message });
  }
};


