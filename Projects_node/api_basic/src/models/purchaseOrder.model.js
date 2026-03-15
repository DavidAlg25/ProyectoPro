import { connect } from '../config/db/connect.js';

class PurchaseOrderModel {
  constructor(id, status, totalAmount, paymentMethod, supplier, user) {
    this.id = id;
    this.status = status;
    this.totalAmount = totalAmount;
    this.paymentMethod = paymentMethod;
    this.supplier = supplier;
    this.user = user;
  }

  async addPurchaseOrder(req, res) {
    try {
      const { status, totalAmount, paymentMethod, supplier, user } = req.body;
      if (!status || !totalAmount || !paymentMethod || !supplier || !user) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "INSERT INTO purchaseorder (purchaseOrder_id,purchaseOrder_status,purchaseOrder_totalAmount,purchaseOrder_paymentMethod,supplier_FK,user_FK) VALUES (?,?,?,?,?,?)";
      const [result] = await connect.query(sqlQuery, [status, totalAmount, paymentMethod, supplier, user]);
      res.status(201).json({
        data: [{ id: result.insertId, status, totalAmount, paymentMethod, supplier, user }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding PurchaseOrder", details: error.message });
    }
  }

  async updatePurchaseOrder(req, res) {
    try {
      const { status, totalAmount, paymentMethod, supplier, user } = req.body;
      if (!status || !totalAmount || !paymentMethod || !supplier || !user) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE purchaseorder SET purchaseOrder_status=?,purchaseOrder_totalAmount=?,purchaseOrder_paymentMethod=?,supplier_FK=?,user_FK=?,updatedAt=? WHERE purchaseOrder_id= ?";
      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");
      const [result] = await connect.query(sqlQuery, [status, totalAmount, paymentMethod, supplier, user, update_at, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "PurchaseOrder not found" });
      res.status(200).json({
        data: [{ status, totalAmount, paymentMethod, supplier, user, update_at }],
        status: 200,
        updated: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating PurchaseOrder", details: error.message });
    }
  }

  async deletePurchaseOrder(req, res) {
    try {
      let sqlQuery = "DELETE FROM purchaseorder WHERE purchaseOrder_id = ?";
      const [result] = await connect.query(sqlQuery, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "PurchaseOrder not found" });
      res.status(200).json({
        data: [],
        status: 200,
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting PurchaseOrder", details: error.message });
    }
  }

  async showPurchaseOrder(res) {
    try {
      let sqlQuery = "SELECT * FROM purchaseorder";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching PurchaseOrders", details: error.message });
    }
  }

  async showPurchaseOrderById(res, req) {
    try {
      const [result] = await connect.query('SELECT * FROM purchaseorder WHERE purchaseOrder_id = ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "PurchaseOrder not found" });
      res.status(200).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Error fetching PurchaseOrder", details: error.message });
    }
  }

}

export default PurchaseOrderModel;