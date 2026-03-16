import { connect } from '../config/db/connect.js';

class SupplierModel {
  constructor(id, name, address, phone, email, status) {
    this.id = id;
    this.name = name;
    this.address = address;
    this.phone = phone;
    this.email = email;
    this.status = status;
    
  }

  async addSupplier(req, res) {
    try {
      const {  name, address, phone, email, status } = req.body;
      if (!name || !address || !phone || !email || !status ) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "INSERT INTO supplier (supplier_id,Supplier_name,supplier_address,supplier_phone,supplier_email,supplier_status) VALUES (?,?,?,?,?,?)";
      const [result] = await connect.query(sqlQuery, [name, address, phone, email, status]);
      res.status(201).json({
        data: [{ id: result.insertId, name, address, phone, email, status }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding Supplier", details: error.message });
    }
  }

  async updateSupplier(req, res) {
    try {
      const { name, address, phone, email, status } = req.body;
      if (!name || !address || !phone || !email || !status) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE supplier SET supplier_name=?,Supplier_address=?,supplier_phone=?,supplier_email=?,supplier_status=?,updatedAt=? WHERE supplier_id= ?";
      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");
      const [result] = await connect.query(sqlQuery, [name, address, phone, email, status, update_at, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Supplier not found" });
      res.status(200).json({
        data: [{ name, address, phone, email, status, update_at }],
        status: 200,
        updated: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating Supplier", details: error.message });
    }
  }

  async deleteSupplier(req, res) {
    try {
      let sqlQuery = "DELETE FROM supplier WHERE supplier_id = ?";
      const [result] = await connect.query(sqlQuery, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Supplier not found" });
      res.status(200).json({
        data: [],
        status: 200,
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting Supplier", details: error.message });
    }
  }

  async showSupplier(res) {
    try {
      let sqlQuery = "SELECT * FROM supplier";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching Suppliers", details: error.message });
    }
  }

  async showSupplierById(res, req) {
    try {
      const [result] = await connect.query('SELECT * FROM supplier WHERE supplier_id = ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "Supplier not found" });
      res.status(200).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Error fetching Supplier", details: error.message });
    }
  }

}

export default SupplierModel;