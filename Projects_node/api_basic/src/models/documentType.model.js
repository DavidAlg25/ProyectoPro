import { connect } from '../config/db/connect.js';

class DocumentTypeModel {
  constructor(id, code, description) {
    this.id = id;
    this.code = code;
    this.description = description;
  }

  async addDocumentType(req, res) {
    try {
      const { code, description } = req.body;
      if (!code || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "INSERT INTO documenttype (doc_type_id,code,description) VALUES (?,?,?)";
      const [result] = await connect.query(sqlQuery, [code, description]);
      res.status(201).json({
        data: [{ id: result.insertId, code, description }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding DocumentType", details: error.message });
    }
  }

  async updateDocumentType(req, res) {
    try {
      const { code, description } = req.body;
      if (!code || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE documenttype SET code=?,description=? WHERE doc_type_id= ?";
      const [result] = await connect.query(sqlQuery, [code, description, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "DocumentType not found" });
      res.status(200).json({
        data: [{ code, description }],
        status: 200,
        updated: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating DocumentType", details: error.message });
    }
  }

  async deleteDocumentType(req, res) {
    try {
      let sqlQuery = "DELETE FROM documenttype WHERE doc_type_id = ?";
      const [result] = await connect.query(sqlQuery, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "DocumentType not found" });
      res.status(200).json({
        data: [],
        status: 200,
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting DocumentType", details: error.message });
    }
  }

  async showDocumentType(res) {
    try {
      let sqlQuery = "SELECT * FROM documenttype";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching DocumentTypes", details: error.message });
    }
  }

  async showDocumentTypeById(res, req) {
    try {
      const [result] = await connect.query('SELECT * FROM documenttype WHERE doc_type_id = ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "DocumentType not found" });
      res.status(200).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Error fetching DocumentType", details: error.message });
    }
  }

}

export default DocumentTypeModel;