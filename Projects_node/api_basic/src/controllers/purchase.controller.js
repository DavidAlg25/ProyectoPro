import SupplierModel from '../models/supplier.model.js';
import PurchaseOrderModel from '../models/purchaseOrder.model.js';
import PurchaseDetailModel from '../models/purchaseDetail.model.js';

// =============================================
// MÉTODOS PARA PROVEEDORES
// =============================================

export const getSuppliersWithStats = async (req, res) => {
  try {
    const supplierModel = new SupplierModel();
    await supplierModel.getSuppliersWithStats(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching suppliers", details: error.message });
  }
};

// Supplier CRUD
export const showSupplier = async (req, res) => {
  try {
    const supplierModel = new SupplierModel();
    await supplierModel.showSupplier(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching suppliers", details: error.message });
  }
};

export const showSupplierId = async (req, res) => {
  try {
    const supplierModel = new SupplierModel();
    await supplierModel.showSupplierById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching supplier", details: error.message });
  }
};

export const addSupplier = async (req, res) => {
  try {
    const supplierModel = new SupplierModel();
    await supplierModel.addSupplier(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding supplier", details: error.message });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const supplierModel = new SupplierModel();
    await supplierModel.updateSupplier(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating supplier", details: error.message });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const supplierModel = new SupplierModel();
    await supplierModel.deleteSupplier(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting supplier", details: error.message });
  }
};

// =============================================
// MÉTODOS PARA ÓRDENES DE COMPRA
// =============================================

export const createPurchaseOrder = async (req, res) => {
  try {
    const purchaseModel = new PurchaseOrderModel();
    await purchaseModel.createPurchaseOrder(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error creating purchase order", details: error.message });
  }
};

export const receivePurchaseOrder = async (req, res) => {
  try {
    const purchaseModel = new PurchaseOrderModel();
    await purchaseModel.receivePurchaseOrder(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error receiving purchase order", details: error.message });
  }
};

export const cancelPurchaseOrder = async (req, res) => {
  try {
    const purchaseModel = new PurchaseOrderModel();
    await purchaseModel.cancelPurchaseOrder(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error cancelling purchase order", details: error.message });
  }
};

// PurchaseOrder CRUD
export const showPurchaseOrder = async (req, res) => {
  try {
    const purchaseModel = new PurchaseOrderModel();
    await purchaseModel.showPurchaseOrder(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching purchase orders", details: error.message });
  }
};

export const showPurchaseOrderId = async (req, res) => {
  try {
    const purchaseModel = new PurchaseOrderModel();
    await purchaseModel.showPurchaseOrderById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching purchase order", details: error.message });
  }
};

export const addPurchaseOrder = async (req, res) => {
  try {
    const purchaseModel = new PurchaseOrderModel();
    await purchaseModel.addPurchaseOrder(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding purchase order", details: error.message });
  }
};

export const updatePurchaseOrder = async (req, res) => {
  try {
    const purchaseModel = new PurchaseOrderModel();
    await purchaseModel.updatePurchaseOrder(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating purchase order", details: error.message });
  }
};

export const deletePurchaseOrder = async (req, res) => {
  try {
    const purchaseModel = new PurchaseOrderModel();
    await purchaseModel.deletePurchaseOrder(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting purchase order", details: error.message });
  }
};

// =============================================
// MÉTODOS PARA DETALLES DE COMPRA
// =============================================

// PurchaseDetail CRUD
export const showPurchaseDetail = async (req, res) => {
  try {
    const detailModel = new PurchaseDetailModel();
    await detailModel.showPurchaseDetail(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching purchase details", details: error.message });
  }
};

export const showPurchaseDetailId = async (req, res) => {
  try {
    const detailModel = new PurchaseDetailModel();
    await detailModel.showPurchaseDetailById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching purchase detail", details: error.message });
  }
};

export const addPurchaseDetail = async (req, res) => {
  try {
    const detailModel = new PurchaseDetailModel();
    await detailModel.addPurchaseDetail(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding purchase detail", details: error.message });
  }
};

export const updatePurchaseDetail = async (req, res) => {
  try {
    const detailModel = new PurchaseDetailModel();
    await detailModel.updatePurchaseDetail(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating purchase detail", details: error.message });
  }
};

export const deletePurchaseDetail = async (req, res) => {
  try {
    const detailModel = new PurchaseDetailModel();
    await detailModel.deletePurchaseDetail(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting purchase detail", details: error.message });
  }
};