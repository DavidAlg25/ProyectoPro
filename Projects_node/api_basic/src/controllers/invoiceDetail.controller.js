import InvoiceDetailModel from '../models/invoiceDetail.model.js';

export const showInvoiceDetail = async (req, res) => {
  try {
    const invoiceDetailModel = new InvoiceDetailModel();
    invoiceDetailModel.showInvoiceDetail(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching InvoiceDetails", details: error.message });
  }
};

export const showInvoiceDetailId = async (req, res) => {
  try {
    const invoiceDetailModel = new InvoiceDetailModel();
    invoiceDetailModel.showInvoiceDetailById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching InvoiceDetail", details: error.message });
  }
};

export const addInvoiceDetail = async (req, res) => {
  try {
    const invoiceDetailModel = new InvoiceDetailModel();
    invoiceDetailModel.addInvoiceDetail(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding InvoiceDetail", details: error.message });
  }
};

export const updateInvoiceDetail = async (req, res) => {
  try {
    const invoiceDetailModel = new InvoiceDetailModel();
    invoiceDetailModel.updateInvoiceDetail(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating InvoiceDetail", details: error.message });
  }
};

export const deleteInvoiceDetail = async (req, res) => {
  try {
    const invoiceDetailModel = new InvoiceDetailModel();
    invoiceDetailModel.deleteInvoiceDetail(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting InvoiceDetail", details: error.message });
  }
};


