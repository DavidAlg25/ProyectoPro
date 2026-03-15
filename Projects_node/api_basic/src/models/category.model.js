import { connect } from '../config/db/connect.js';

class CategoryModel {
  constructor(id, name, description) {
    this.id = id;
    this.name = name;
    this.description = description;
  }

  async addCategory(req, res) {
    try {
      const { name, description } = req.body;
      if (!name || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "INSERT INTO category (category_id,category_name,category_description) VALUES (?,?,?)";
      const [result] = await connect.query(sqlQuery, [name, description]);
      res.status(201).json({
        data: [{ id: result.insertId, name, description }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding Category", details: error.message });
    }
  }

  async updateCategory(req, res) {
    try {
      const { name, description } = req.body;
      if (!name || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE category SET category_name=?,category_description=? WHERE category_id= ?";
      const [result] = await connect.query(sqlQuery, [name, description,  req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Category not found" });
      res.status(200).json({
        data: [{ name, description }],
        status: 200,
        updated: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating Category", details: error.message });
    }
  }

  async deleteCategory(req, res) {
    try {
      let sqlQuery = "DELETE FROM category WHERE category_id = ?";
      const [result] = await connect.query(sqlQuery, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Category not found" });
      res.status(200).json({
        data: [],
        status: 200,
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting Category", details: error.message });
    }
  }

  async showCategory(res) {
    try {
      let sqlQuery = "SELECT * FROM category";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching Categorys", details: error.message });
    }
  }

  async showCategoryById(res, req) {
    try {
      const [result] = await connect.query('SELECT * FROM category WHERE category_id = ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "Category not found" });
      res.status(200).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Error fetching Category", details: error.message });
    }
  }

}

export default CategoryModel;