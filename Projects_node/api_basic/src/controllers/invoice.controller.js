import InvoiceModel from '../models/invoice.model.js';


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

export const cancelInvoice = async (req, res) => {
  try {
    const invoiceModel = new InvoiceModel();
    await invoiceModel.cancelInvoice(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error cancelling invoice", details: error.message });
  }
};




