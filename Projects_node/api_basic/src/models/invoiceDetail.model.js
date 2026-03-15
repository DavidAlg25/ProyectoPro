import { connect } from '../config/db/connect.js';

class InvoiceDetailModel {
  constructor(id, variant, invoice, quantity, unitPrice, subtotal, status) {
    this.id = id;
    this.variant = variant;
    this.invoice = invoice;
    this.quantity = quantity;
    this.unitPrice =unitPrice;
    this.subtotal = subtotal;
    this.status = status;
  }

  async addInvoiceDetail(req, res) {
    try {
      const { variant, invoice, quantity, unitPrice, subtotal, status } = req.body;
      if (!variant || !invoice || !quantity || !unitPrice || !subtotal || !status) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "INSERT INTO invoicedetail (invoice_detail_id,variant_FK,invoice_FK,quantity,unit_price,subtotal,status) VALUES (?,?,?,?,?,?,?)";
      const [result] = await connect.query(sqlQuery, [variant, invoice, quantity, unitPrice, subtotal, status]);
      res.status(201).json({
        data: [{ id: result.insertId, variant, invoice, quantity, unitPrice, subtotal, status }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding InvoiceDetail", details: error.message });
    }
  }

  async updateInvoiceDetail(req, res) {
    try {
      const { variant, invoice, quantity, unitPrice, subtotal, status } = req.body;
      if (!variant || !invoice || !quantity || !unitPrice || !subtotal || !status) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE invoicedetail SET variant_FK=?,invoice_FK=?,quantity=?,unit_price=?,subtotal=?,status=? WHERE invoice_detail_id= ?";
      const [result] = await connect.query(sqlQuery, [variant, invoice, quantity, unitPrice, , subtotal, status, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "InvoiceDetail not found" });
      res.status(200).json({
        data: [{ variant, invoice, quantity, unitPrice, subtotal, status}],
        status: 200,
        updated: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating InvoiceDetail", details: error.message });
    }
  }

  async deleteInvoiceDetail(req, res) {
    try {
      let sqlQuery = "DELETE FROM invoicedetail WHERE invoice_detail_id = ?";
      const [result] = await connect.query(sqlQuery, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "InvoiceDetail not found" });
      res.status(200).json({
        data: [],
        status: 200,
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting InvoiceDetail", details: error.message });
    }
  }

  async showInvoiceDetail(res) {
    try {
      let sqlQuery = "SELECT * FROM invoicedetail";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching InvoiceDetails", details: error.message });
    }
  }

  async showInvoiceDetailById(res, req) {
    try {
      const [result] = await connect.query('SELECT * FROM invoicedetail WHERE invoice_detail_id = ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "InvoiceDetail not found" });
      res.status(200).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Error fetching InvoiceDetail", details: error.message });
    }
  }

}

export default InvoiceDetailModel;