import { connect } from '../config/db/connect.js';

class CustomerModel {
  constructor(id, user, doc_type, document_number, first_name, second_name, first_last_name, second_last_name) {
    this.id = id;
    this.user = user;
    this.doc_type = doc_type;
    this.document_number = document_number;
    this.first_name = first_name;
    this.second_name = second_name;
    this.first_last_name = first_last_name;
    this.second_last_name = second_last_name;
  }

  async addCustomer(req, res) {
    try {
      const { user, doc_type, document_number, first_name, second_name, first_last_name, second_last_name} = req.body;
      if (!user || !doc_type || !document_number || !first_name || !second_name || !first_last_name || !second_last_name) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "INSERT INTO customer (customer_id,user_FK,doc_type_id,document_number,first_name,second_name,first_last_name,second_last_name) VALUES (?,?,?,?,?,?,?,?)";
      const [result] = await connect.query(sqlQuery, [user, doc_type, document_number, first_name, second_name, first_last_name, second_last_name]);
      res.status(201).json({
        data: [{ id: result.insertId, user, doc_type, document_number, first_name, second_name, first_last_name, second_last_name }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding Customer", details: error.message });
    }
  }

  async updateCustomer(req, res) {
    try {
      const { user, doc_type, document_number, first_name, second_name, first_last_name, second_last_name } = req.body;
      if (!user || !doc_type || !document_number || !first_name || !second_name || !first_last_name || !second_last_name) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE customer SET user_FK=?,doc_type_id=?,document_number=?,first_name=?,second_name=?,first_last_name=?,second_last_name=?,updatedAt=? WHERE customer_id= ?";
      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");
      const [result] = await connect.query(sqlQuery, [user, doc_type, document_number, first_name, second_name, first_last_name, second_last_name, update_at, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Customer not found" });
      res.status(200).json({
        data: [{ user, doc_type, document_number, first_name, second_name, first_last_name, update_at }],
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
      res.status(500).json({ error: "Error deleting Customer", details: error.message });
    }
  }

  async showCustomer(res) {
    try {
      let sqlQuery = "SELECT * FROM customer";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching Customers", details: error.message });
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