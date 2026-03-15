import { connect } from '../config/db/connect.js';

class InventoryMovementModel {
  constructor(id, variant, invoice, purchase, user, type, quantity, description) {
    this.id = id;
    this.variant = variant;
    this.invoice = invoice;
    this.purchase = purchase;
    this.user = user;
    this.type = type;
    this.quantity = quantity;
    this.description = description;
  }

  async addInventoryMovement(req, res) {
    try {
      const { variant, invoice, purchase, user, type, quantity, description} = req.body;
      if (!variant || !invoice || !purchase || !user || !type || !quantity || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "INSERT INTO inventorymovement (inventoryMovement_id,variant_FK,invoice_FK,purchase_FK,user_FK,movement_type,quantity,movement_description) VALUES (?,?,?,?,?,?,?,?)";
      const [result] = await connect.query(sqlQuery, [variant, invoice, purchase, user, type, quantity, description]);
      res.status(201).json({
        data: [{ id: result.insertId, variant, invoice, purchase, user, type, quantity, description }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding InventoryMovement", details: error.message });
    }
  }

  async updateInventoryMovement(req, res) {
    try {
      const { variant, invoice, purchase, user, type, quantity, description } = req.body;
      if (!variant || !invoice || !purchase || !user || !type || !quantity || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE inventorymovement SET variant_FK=?,invoice_FK=?,purchase_FK=?,user_FK=?,movement_type=?,quantity=?,movement_description=?,updatedAt=? WHERE inventoryMovement_id= ?";
      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");
      const [result] = await connect.query(sqlQuery, [variant, invoice, purchase, user, type, quantity, description, update_at, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "InventoryMovement not found" });
      res.status(200).json({
        data: [{ variant, invoice, purchase, user, type, quantity, update_at }],
        status: 200,
        updated: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating InventoryMovement", details: error.message });
    }
  }

  async deleteInventoryMovement(req, res) {
    try {
      let sqlQuery = "DELETE FROM inventorymovement WHERE inventoryMovement_id = ?";
      const [result] = await connect.query(sqlQuery, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "InventoryMovement not found" });
      res.status(200).json({
        data: [],
        status: 200,
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting InventoryMovement", details: error.message });
    }
  }

  async showInventoryMovement(res) {
    try {
      let sqlQuery = "SELECT * FROM inventorymovement";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching InventoryMovements", details: error.message });
    }
  }

  async showInventoryMovementById(res, req) {
    try {
      const [result] = await connect.query('SELECT * FROM inventorymovement WHERE inventoryMovement_id = ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "InventoryMovement not found" });
      res.status(200).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Error fetching InventoryMovement", details: error.message });
    }
  }

}

export default InventoryMovementModel;