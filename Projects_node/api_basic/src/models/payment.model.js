import { connect } from '../config/db/connect.js';

class PaymentModel {
  constructor(id, date, amount, method, reference, order) {
    this.id = id;
    this.date = date;
    this.amount = amount;
    this.method = method;
    this.reference = reference;
    this.order = order;
  }

  async addPayment(req, res) {
    try {
      const { date, amount, method, reference, order } = req.body;
      if (!date || !amount || !method || !reference || !order) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "INSERT INTO payment (payment_id,payment_date,payment_amount,payment_method,payment_reference,order_FK) VALUES (?,?,?,?,?,?)";
      const [result] = await connect.query(sqlQuery, [date, amount, method, reference, order]);
      res.status(201).json({
        data: [{ id: result.insertId, date, amount, method, reference, order }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding Payment", details: error.message });
    }
  }

  async updatePayment(req, res) {
    try {
      const { date, amount, method, reference, order } = req.body;
      if (!date || !amount || !method || !reference || !order) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE payment SET payment_date=?,payment_amount=?,payment_method=?,payment_reference=?,order_FK=?,updatedAt=? WHERE payment_id= ?";
      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");
      const [result] = await connect.query(sqlQuery, [date, amount, method, reference, order, update_at, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Payment not found" });
      res.status(200).json({
        data: [{ date, amount, method, reference, order, update_at }],
        status: 200,
        updated: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating Payment", details: error.message });
    }
  }

  async deletePayment(req, res) {
    try {
      let sqlQuery = "DELETE FROM payment WHERE payment_id = ?";
      const [result] = await connect.query(sqlQuery, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Payment not found" });
      res.status(200).json({
        data: [],
        status: 200,
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting Payment", details: error.message });
    }
  }

  async showPayment(res) {
    try {
      let sqlQuery = "SELECT * FROM payment";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching Payments", details: error.message });
    }
  }

  async showPaymentById(res, req) {
    try {
      const [result] = await connect.query('SELECT * FROM payment WHERE payment_id = ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "Payment not found" });
      res.status(200).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Error fetching Payment", details: error.message });
    }
  }

}

export default PaymentModel;