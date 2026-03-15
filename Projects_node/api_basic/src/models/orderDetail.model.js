import { connect } from '../config/db/connect.js';

class OrderDetailModel {
  constructor(id, order, variant, quantity, unitPrice) {
    this.id = id;
    this.order = order;
    this.variant = variant;
    this.quantity = quantity;
    this.unitPrice =unitPrice;
  }

  async addOrderDetail(req, res) {
    try {
      const { order, variant, quantity, unitPrice } = req.body;
      if (!order || !variant || !quantity || !unitPrice) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "INSERT INTO orderdetail (order_detail_id,order_id,variant_FK,order_detail_quantity,order_detail_unit_price) VALUES (?,?,?,?,?)";
      const [result] = await connect.query(sqlQuery, [order, variant, quantity, unitPrice]);
      res.status(201).json({
        data: [{ id: result.insertId, order, variant, quantity, unitPrice }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding OrderDetail", details: error.message });
    }
  }

  async updateOrderDetail(req, res) {
    try {
      const { order, variant, quantity, unitPrice } = req.body;
      if (!order || !variant || !quantity || !unitPrice) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE orderdetail SET order_id=?,variant_FK=?,order_detail_quantity=?,order_detail_unit_price=?,updatedAt=? WHERE order_detail_id= ?";
      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");
      const [result] = await connect.query(sqlQuery, [order, variant, quantity, unitPrice, update_at, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "OrderDetail not found" });
      res.status(200).json({
        data: [{ order, variant, quantity, unitPrice, update_at }],
        status: 200,
        updated: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating OrderDetail", details: error.message });
    }
  }

  async deleteOrderDetail(req, res) {
    try {
      let sqlQuery = "DELETE FROM orderdetail WHERE order_detail_id = ?";
      const [result] = await connect.query(sqlQuery, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "OrderDetail not found" });
      res.status(200).json({
        data: [],
        status: 200,
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting OrderDetail", details: error.message });
    }
  }

  async showOrderDetail(res) {
    try {
      let sqlQuery = "SELECT * FROM orderdetail";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching OrderDetails", details: error.message });
    }
  }

  async showOrderDetailById(res, req) {
    try {
      const [result] = await connect.query('SELECT * FROM orderdetail WHERE order_detail_id = ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "OrderDetail not found" });
      res.status(200).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Error fetching OrderDetail", details: error.message });
    }
  }

}

export default OrderDetailModel;