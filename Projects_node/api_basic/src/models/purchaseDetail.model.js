import { connect } from '../config/db/connect.js';

class PurchaseDetailModel {
  constructor(id, quantity, unitPrice, subTotal, purchaseOrder, variant) {
    this.id = id;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
    this.subTotal = subTotal;
    this.purchaseOrder = purchaseOrder;
    this.variant = variant;
  }

  async addPurchaseDetail(req, res) {
    try {
      const { quantity, unitPrice, subTotal, purchaseOrder, variant } = req.body;
      if (!quantity || !unitPrice || !subTotal || !purchaseOrder || !variant) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "INSERT INTO purchasedetail (purchaseDetail_id,purchaseDetail_quantity,purchaseDetail_unitPrice,purchaseDetail_subTotal,purchaseOrder_FK,variant_FK) VALUES (?,?,?,?,?,?)";
      const [result] = await connect.query(sqlQuery, [quantity, unitPrice, subTotal, purchaseOrder, variant]);
      res.status(201).json({
        data: [{ id: result.insertId, quantity, unitPrice, subTotal, purchaseOrder, variant }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding PurchaseDetail", details: error.message });
    }
  }

  async updatePurchaseDetail(req, res) {
    try {
      const { quantity, unitPrice, subTotal, purchaseOrder, variant } = req.body;
      if (!quantity || !unitPrice || !subTotal || !purchaseOrder || !variant) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE purchasedetail SET purchaseDetail_quantity=?,purchaseDetail_unitPrice=?,purchaseDetail_subTotal=?,purchaseOrder_FK=?,variant_FK=? WHERE purchaseDetail_id= ?";
      const [result] = await connect.query(sqlQuery, [quantity, unitPrice, subTotal, purchaseOrder, variant, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "PurchaseDetail not found" });
      res.status(200).json({
        data: [{ quantity, unitPrice, subTotal, purchaseOrder, variant }],
        status: 200,
        updated: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating PurchaseDetail", details: error.message });
    }
  }

  async deletePurchaseDetail(req, res) {
    try {
      let sqlQuery = "DELETE FROM purchasedetail WHERE purchaseDetail_id = ?";
      const [result] = await connect.query(sqlQuery, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "PurchaseDetail not found" });
      res.status(200).json({
        data: [],
        status: 200,
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting PurchaseDetail", details: error.message });
    }
  }

  async showPurchaseDetail(res) {
    try {
      let sqlQuery = "SELECT * FROM purchasedetail";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching PurchaseDetails", details: error.message });
    }
  }

  async showPurchaseDetailById(res, req) {
    try {
      const [result] = await connect.query('SELECT * FROM purchasedetail WHERE purchaseDetail_id = ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "PurchaseDetail not found" });
      res.status(200).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Error fetching PurchaseDetail", details: error.message });
    }
  }

}

export default PurchaseDetailModel;