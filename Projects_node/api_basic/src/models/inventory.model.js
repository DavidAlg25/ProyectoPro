import { connect } from '../config/db/connect.js';

class InventoryModel {
  constructor(id, variant, stock, min_stock, max_stock, is_active) {
    this.id = id;
    this.variant = variant;
    this.stock = stock;
    this.min_stock = min_stock;
    this.max_stock = max_stock;
    this.is_active = is_active;
  }

  async addInventory(req, res) {
    try {
      const { variant, stock, min_stock, max_stock, is_active } = req.body;
      if (!variant || !stock || !min_stock || !max_stock || !is_active) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "INSERT INTO inventory (inventory_id,variant_FK,stock,min_stock,max_stock,is_active) VALUES (?,?.?,?,?,?)";
      const [result] = await connect.query(sqlQuery, [variant, stock, min_stock, max_stock, is_active]);
      res.status(201).json({
        data: [{ id: result.insertId, variant, stock, min_stock, max_stock, is_active }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding Inventory", details: error.message });
    }
  }

  async updateInventory(req, res) {
    try {
      const { variant, stock, min_stock, max_stock, is_active } = req.body;
      if (!variant || !stock || !min_stock || !max_stock || !is_active) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE inventory SET variant_FK=?,stock=?,min_stock=?,max_stock=?,is_active? WHERE inventory_id= ?";
      const [result] = await connect.query(sqlQuery, [variant, stock, min_stock, max_stock, is_active, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Inventory not found" });
      res.status(200).json({
        data: [{ variant, stock, min_stock, max_stock, is_active }],
        status: 200,
        updated: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating Inventory", details: error.message });
    }
  }

  async deleteInventory(req, res) {
    try {
      let sqlQuery = "DELETE FROM inventory WHERE inventory_id = ?";
      const [result] = await connect.query(sqlQuery, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Inventory not found" });
      res.status(200).json({
        data: [],
        status: 200,
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting Inventory", details: error.message });
    }
  }

  async showInventory(res) {
    try {
      let sqlQuery = "SELECT * FROM inventory";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching Inventory", details: error.message });
    }
  }

  async showInventoryById(res, req) {
    try {
      const [result] = await connect.query('SELECT * FROM inventory WHERE inventory_id = ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "Inventory not found" });
      res.status(200).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Error fetching Inventory", details: error.message });
    }
  }

}

export default InventoryModel;