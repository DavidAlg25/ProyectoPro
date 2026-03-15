import InvoiceModel from '../models/invoice.model.js';

export const showInvoice = async (req, res) => {
  try {
    const invoiceModel = new InvoiceModel();
    invoiceModel.showInvoice(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Invoices", details: error.message });
  }
};

export const showInvoiceId = async (req, res) => {
  try {
    const invoiceModel = new InvoiceModel();
    invoiceModel.showInvoiceById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Invoice", details: error.message });
  }
};

export const addInvoice = async (req, res) => {
  try {
    const invoiceModel = new InvoiceModel();
    invoiceModel.addInvoice(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding Invoice", details: error.message });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const invoiceModel = new InvoiceModel();
    invoiceModel.updateInvoice(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating Invoice", details: error.message });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const invoiceModel = new InvoiceModel();
    invoiceModel.deleteInvoice(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting Invoice", details: error.message });
  }
};


