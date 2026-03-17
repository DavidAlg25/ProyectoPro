import InvoiceModel from '../models/invoice.model.js';
import InvoiceDetailModel from '../models/invoiceDetail.model.js';


// =============================================
// MÉTODOS PARA FACTURAS (Clientes)
// =============================================

export const generateInvoiceFromOrder = async (req, res) => {
  try {
    const invoiceModel = new InvoiceModel();
    await invoiceModel.generateInvoiceFromOrder(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error generating invoice", details: error.message });
  }
};

export const getMyInvoices = async (req, res) => {
  try {
    const invoiceModel = new InvoiceModel();
    await invoiceModel.getMyInvoices(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching invoices", details: error.message });
  }
};

export const getInvoiceDetails = async (req, res) => {
  try {
    const invoiceModel = new InvoiceModel();
    await invoiceModel.getInvoiceDetails(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching invoice details", details: error.message });
  }
};

// =============================================
// MÉTODOS CRUD BASE (para administración)
// =============================================

// Invoice CRUD
export const showInvoice = async (req, res) => {
  try {
    const invoiceModel = new InvoiceModel();
    await invoiceModel.showInvoice(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching invoices", details: error.message });
  }
};

export const showInvoiceId = async (req, res) => {
  try {
    const invoiceModel = new InvoiceModel();
    await invoiceModel.showInvoiceById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching invoice", details: error.message });
  }
};

export const addInvoice = async (req, res) => {
  try {
    const invoiceModel = new InvoiceModel();
    await invoiceModel.addInvoice(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding invoice", details: error.message });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const invoiceModel = new InvoiceModel();
    await invoiceModel.updateInvoice(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating invoice", details: error.message });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const invoiceModel = new InvoiceModel();
    await invoiceModel.deleteInvoice(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting invoice", details: error.message });
  }
};

export const cancelInvoice = async (req, res) => {
  try {
    const invoiceModel = new InvoiceModel();
    await invoiceModel.cancelInvoice(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error cancelling invoice", details: error.message });
  }
};

// InvoiceDetail CRUD
export const showInvoiceDetail = async (req, res) => {
  try {
    const detailModel = new InvoiceDetailModel();
    await detailModel.showInvoiceDetail(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching invoice details", details: error.message });
  }
};

export const showInvoiceDetailId = async (req, res) => {
  try {
    const detailModel = new InvoiceDetailModel();
    await detailModel.showInvoiceDetailById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching invoice detail", details: error.message });
  }
};

export const addInvoiceDetail = async (req, res) => {
  try {
    const detailModel = new InvoiceDetailModel();
    await detailModel.addInvoiceDetail(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding invoice detail", details: error.message });
  }
};

export const updateInvoiceDetail = async (req, res) => {
  try {
    const detailModel = new InvoiceDetailModel();
    await detailModel.updateInvoiceDetail(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating invoice detail", details: error.message });
  }
};

export const deleteInvoiceDetail = async (req, res) => {
  try {
    const detailModel = new InvoiceDetailModel();
    await detailModel.deleteInvoiceDetail(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting invoice detail", details: error.message });
  }
};



