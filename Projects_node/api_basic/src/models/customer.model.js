import { connect } from '../config/db/connect.js';

class CustomerModel {
  constructor(id, name, description) {
    this.id = id;
    this.name = name;
    this.description = description;
  }

  async addCustomer(req, res) {
    try {
      const { name, description } = req.body;
      if (!name || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "INSERT INTO customer (customer_name,customer_description) VALUES (?,?)";
      const [result] = await connect.query(sqlQuery, [name, description]);
      res.status(201).json({
        data: [{ id: result.insertId, name, description }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding Customer", details: error.message });
    }
  }

  async updateCustomer(req, res) {
    try {
      const { name, description } = req.body;
      if (!name || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE customer SET customer_name=?,customer_description=?,update_at=? WHERE role_id= ?";
      const updateAt = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");
      const [result] = await connect.query(sqlQuery, [name, description, updateAt, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Customer not found" });
      res.status(200).json({
        data: [{ name, description, update_at }],
        status: 200,
        updated: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating Customer", details: error.message });
    }
  }

  async deleteCustomer(req, res) {
    try {
      let sqlQuery = "DELETE FROM customer WHERE customer_id = ?";
      const [result] = await connect.query(sqlQuery, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Customer not found" });
      res.status(200).json({
        data: [],
        status: 200,
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting Role", details: error.message });
    }
  }

  async showCustomer(res) {
    try {
      let sqlQuery = "SELECT * FROM customer";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching Customer", details: error.message });
    }
  }

  async showCustomerById(res, req) {
    try {
      const [result] = await connect.query('SELECT * FROM customer WHERE customer_id = ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "Customer not found" });
      res.status(200).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Error fetching Customer", details: error.message });
    }
  }

}

export default CustomerModel;