import PurchaseDetailModel from '../models/purchaseDetail.model.js';

export const showPurchaseDetail = async (req, res) => {
  try {
    const purchaseDetailModel = new PurchaseDetailModel();
    purchaseDetailModel.showPurchaseDetail(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching PurchaseDetails", details: error.message });
  }
};

export const showPurchaseDetailId = async (req, res) => {
  try {
    const purchaseDetailModel = new PurchaseDetailModel();
    purchaseDetailModel.showPurchaseDetailById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching PurchaseDetail", details: error.message });
  }
};

export const addPurchaseDetail = async (req, res) => {
  try {
    const purchaseDetailModel = new PurchaseDetailModel();
    purchaseDetailModel.addPurchaseDetail(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding PurchaseDetail", details: error.message });
  }
};

export const updatePurchaseDetail = async (req, res) => {
  try {
    const purchaseDetailModel = new PurchaseDetailModel();
    purchaseDetailModel.updatePurchaseDetail(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating PurchaseDetail", details: error.message });
  }
};

export const deletePurchaseDetail = async (req, res) => {
  try {
    const purchaseDetailModel = new PurchaseDetailModel();
    purchaseDetailModel.deletePurchaseDetail(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting PurchaseDetail", details: error.message });
  }
};


