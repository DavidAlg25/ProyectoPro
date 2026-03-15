import { connect } from '../config/db/connect.js';

class CartItemModel {
  constructor(id, quantity, unitPrice, shoppingCart, variant) {
    this.id = id;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
    this.shoppingCart = shoppingCart;
    this.variant = variant;
  }

  async addCartItem(req, res) {
    try {
      const { quantity, unitPrice, shoppingCart, variant } = req.body;
      if (!quantity || !unitPrice || !shoppingCart || !variant) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "INSERT INTO cartitem (cartItem_id,cartItem_quantity,cartItem_unitPrice,shoppingCart_FK,variant_FK) VALUES (?,?,?,?,?)";
      const [result] = await connect.query(sqlQuery, [quantity, unitPrice, shoppingCart, variant]);
      res.status(201).json({
        data: [{ id: result.insertId, quantity, unitPrice, shoppingCart, variant }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding CartItem", details: error.message });
    }
  }

  async updateCartItem(req, res) {
    try {
      const { quantity, unitPrice, shoppingCart, variant } = req.body;
      if (!quantity || !unitPrice || !shoppingCart || !variant) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE cartitem SET cartItem_id=?,cartItem_unitPrice=?,shoppingCart_FK=?,variant_FK=?,updatedAt=? WHERE cartItem_id= ?";
      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");
      const [result] = await connect.query(sqlQuery, [quantity, unitPrice, shoppingCart, variant, update_at, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "CartItem not found" });
      res.status(200).json({
        data: [{ quantity, unitPrice, shoppingCart, variant, update_at }],
        status: 200,
        updated: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating CartItem", details: error.message });
    }
  }

  async deleteCartItem(req, res) {
    try {
      let sqlQuery = "DELETE FROM cartitem WHERE cartItem_id = ?";
      const [result] = await connect.query(sqlQuery, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "CartItem not found" });
      res.status(200).json({
        data: [],
        status: 200,
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting CartItem", details: error.message });
    }
  }

  async showCartItem(res) {
    try {
      let sqlQuery = "SELECT * FROM cartitem";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching CartItems", details: error.message });
    }
  }

  async showCartItemById(res, req) {
    try {
      const [result] = await connect.query('SELECT * FROM cartitem WHERE cartItem_id = ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "CartItem not found" });
      res.status(200).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Error fetching CartItem", details: error.message });
    }
  }

}

export default CartItemModel;