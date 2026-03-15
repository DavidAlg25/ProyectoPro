import { connect } from '../config/db/connect.js';

class InvoiceModel {
  constructor(id, user, customer, order, totalAmount, status) {
    this.id = id;
    this.user = user;
    this.customer = customer;
    this.order = order;
    this.totalAmount =totalAmount;
    this.status = status;
  }

  async addInvoice(req, res) {
    try {
      const { user, customer, order, totalAmount, status } = req.body;
      if (!user || !customer || !order || !totalAmount || !status) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "INSERT INTO invoice (invoice_id,user_FK,customer_FK,order_FK,total_amount,status) VALUES (?,?,?,?,?,?)";
      const [result] = await connect.query(sqlQuery, [user, customer, order, totalAmount, status]);
      res.status(201).json({
        data: [{ id: result.insertId, user, customer, order, totalAmount, status }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding Invoice", details: error.message });
    }
  }

  async updateInvoice(req, res) {
    try {
      const { user, customer, order, totalAmount, status } = req.body;
      if (!user || !customer || !order || !totalAmount || !status) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE invoice SET user_FK=?,customer_FK=?,order_FK=?,total_amount=?,status=?,updatedAt WHERE invoice_id= ?";
      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");
      const [result] = await connect.query(sqlQuery, [user, customer, order, totalAmount, status, update_at, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Invoice not found" });
      res.status(200).json({
        data: [{ user, customer, order, totalAmount, status, update_at}],
        status: 200,
        updated: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating Invoice", details: error.message });
    }
  }

  async deleteInvoice(req, res) {
    try {
      let sqlQuery = "DELETE FROM invoice WHERE invoice_id = ?";
      const [result] = await connect.query(sqlQuery, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Invoice not found" });
      res.status(200).json({
        data: [],
        status: 200,
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting Invoice", details: error.message });
    }
  }

  async showInvoice(res) {
    try {
      let sqlQuery = "SELECT * FROM invoice";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching Invoices", details: error.message });
    }
  }

  async showInvoiceById(res, req) {
    try {
      const [result] = await connect.query('SELECT * FROM invoice WHERE invoice_id = ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "Invoice not found" });
      res.status(200).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Error fetching Invoice", details: error.message });
    }
  }

}

export default InvoiceModel;