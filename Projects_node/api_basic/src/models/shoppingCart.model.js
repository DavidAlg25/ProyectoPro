import { connect } from '../config/db/connect.js';

class ShoppingCartModel {
  constructor(id, shoppingCart_status, customer) {
    this.id = id;
    this.shoppingCart_status = shoppingCart_status;
    this.customer = customer;
  }

  async addShoppingCart(req, res) {
    try {
      const { shoppingCart_status, customer } = req.body;
      if (!shoppingCart_status || !customer) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "INSERT INTO shoppingcart (shoppinCart_id,shoppingCart_status,customer_FK) VALUES (?,?,?)";
      const [result] = await connect.query(sqlQuery, [shoppingCart_status, customer]);
      res.status(201).json({
        data: [{ id: result.insertId, shoppingCart_status, customer }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding ShoppingCart", details: error.message });
    }
  }

  async updateShoppingCart(req, res) {
    try {
      const { shoppingCart_status, customer } = req.body;
      if (!shoppingCart_status || !customer) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE shoppingcart SET shoppingCart_status=?,customer_FK=?,updatedAt=? WHERE shoppingCart_id= ?";
      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");
      const [result] = await connect.query(sqlQuery, [shoppingCart_status, customer, update_at, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "ShoppingCart not found" });
      res.status(200).json({
        data: [{ shoppingCart_status, customer, update_at }],
        status: 200,
        updated: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating ShoppingCart", details: error.message });
    }
  }

  async deleteShoppingCart(req, res) {
    try {
      let sqlQuery = "DELETE FROM shoppingcart WHERE shoppingCart_id = ?";
      const [result] = await connect.query(sqlQuery, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "ShoppingCart not found" });
      res.status(200).json({
        data: [],
        status: 200,
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting ShoppingCart", details: error.message });
    }
  }

  async showShoppingCart(res) {
    try {
      let sqlQuery = "SELECT * FROM shoppingcart";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching ShoppingCarts", details: error.message });
    }
  }

  async showShoppingCartById(res, req) {
    try {
      const [result] = await connect.query('SELECT * FROM shoppingcart WHERE shoppingCart_id = ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "ShoppingCart not found" });
      res.status(200).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Error fetching ShoppingCart", details: error.message });
    }
  }

}

export default ShoppingCartModel;