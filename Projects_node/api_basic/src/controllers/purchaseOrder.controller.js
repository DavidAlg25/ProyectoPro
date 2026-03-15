import PurchaseOrderModel from '../models/purchaseOrder.model.js';

export const showPurchaseOrder = async (req, res) => {
  try {
    const purchaseOrderModel = new PurchaseOrderModel();
    purchaseOrderModel.showPurchaseOrder(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching PurchaseOrders", details: error.message });
  }
};

export const showPurchaseOrderId = async (req, res) => {
  try {
    const purchaseOrderModel = new PurchaseOrderModel();
    purchaseOrderModel.showPurchaseOrderById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching PurchaseOrder", details: error.message });
  }
};

export const addPurchaseOrder = async (req, res) => {
  try {
    const purchaseOrderModel = new PurchaseOrderModel();
    purchaseOrderModel.addPurchaseOrder(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding PurchaseOrder", details: error.message });
  }
};

export const updatePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrderModel = new PurchaseOrderModel();
    purchaseOrderModel.updatePurchaseOrder(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating PurchaseOrder", details: error.message });
  }
};

export const deletePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrderModel = new PurchaseOrderModel();
    purchaseOrderModel.deletePurchaseOrder(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting PurchaseOrder", details: error.message });
  }
};


