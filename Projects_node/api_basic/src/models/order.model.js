import { connect } from '../config/db/connect.js';

class OrderModel {
  constructor(id, customer, order_status, totalAmount) {
    this.id = id;
    this.customer = customer;
    this.order_status = order_status;
    this.totalAmount =totalAmount;
  }

  async addOrder(req, res) {
    try {
      const { customer, order_status, totalAmount } = req.body;
      if (!customer || !order_status || !totalAmount) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "INSERT INTO order (order_id,customer_FK,order_status,order_total_amount) VALUES (?,?,?,?)";
      const [result] = await connect.query(sqlQuery, [customer, order_status, totalAmount]);
      res.status(201).json({
        data: [{ id: result.insertId, customer, order_status, totalAmount }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding Order", details: error.message });
    }
  }

  async updateOrder(req, res) {
    try {
      const { customer, order_status, totalAmount } = req.body;
      if (!customer || !order_status || !totalAmount) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE order SET customer_FK=?,order_status=?,order_total_amount=?,updatedAt=? WHERE order_id= ?";
      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");
      const [result] = await connect.query(sqlQuery, [customer, order_status, totalAmount, update_at, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Order not found" });
      res.status(200).json({
        data: [{ customer, order_status, totalAmount, update_at }],
        status: 200,
        updated: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating Order", details: error.message });
    }
  }

  async deleteOrder(req, res) {
    try {
      let sqlQuery = "DELETE FROM order WHERE order_id = ?";
      const [result] = await connect.query(sqlQuery, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Order not found" });
      res.status(200).json({
        data: [],
        status: 200,
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting Order", details: error.message });
    }
  }

  async showOrder(res) {
    try {
      let sqlQuery = "SELECT * FROM o";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching Orders", details: error.message });
    }
  }

  async showOrderById(res, req) {
    try {
      const [result] = await connect.query('SELECT * FROM order WHERE order_id = ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "Order not found" });
      res.status(200).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Error fetching Order", details: error.message });
    }
  }

}

export default OrderModel;