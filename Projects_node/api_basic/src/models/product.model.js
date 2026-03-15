import { connect } from '../config/db/connect.js';

class ProductModel {
  constructor(id, code, name, description, category, product_status, image_url) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.description = description;
    this.category = category;
    this.product_status = product_status;
    this.image_url = image_url;
  }

  async addProduct(req, res) {
    try {
      const { code, name, description, category, product_status, image_url } = req.body;
      if (!code || !name || !description || !category || !product_status || !image_url) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "INSERT INTO products (product_id,product_code,product_name,product_description,status,image_url) VALUES (?,?,?,?,?,?)";
      const [result] = await connect.query(sqlQuery, [code, name, description, category, product_status,image_url]);
      res.status(201).json({
        data: [{ id: result.insertId, code, name, description, category, product_status, image_url }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding Product", details: error.message });
    }
  }

  async updateProduct(req, res) {
    try {
      const { code, name, description, category, product_status, image_url } = req.body;
      if (!code || !name || !description || !category || !product_status || !image_url) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE products SET product_code=?,product_name=?,product_description=?,status=?,image_url=?,updatedAt=? WHERE product_id= ?";
      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");
      const [result] = await connect.query(sqlQuery, [code, name, description, category, product_status, image_url, update_at, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Product not found" });
      res.status(200).json({
        data: [{ code, name, description, category, product_status, image_url, update_at }],
        status: 200,
        updated: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating Product", details: error.message });
    }
  }

  async deleteProduct(req, res) {
    try {
      let sqlQuery = "DELETE FROM products WHERE product_id = ?";
      const [result] = await connect.query(sqlQuery, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Product not found" });
      res.status(200).json({
        data: [],
        status: 200,
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting Product", details: error.message });
    }
  }

  async showProduct(res) {
    try {
      let sqlQuery = "SELECT * FROM products";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching Products", details: error.message });
    }
  }

  async showProductById(res, req) {
    try {
      const [result] = await connect.query('SELECT * FROM products WHERE product_id = ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "Product not found" });
      res.status(200).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Error fetching Product", details: error.message });
    }
  }

}

export default ProductModel;