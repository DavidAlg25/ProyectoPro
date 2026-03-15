import { connect } from '../config/db/connect.js';

class ProductVariantModel {
  constructor(id, product, size, unitPrice, variant_status) {
    this.id = id;
    this.product = product;
    this.size = size;
    this.unitPrice = unitPrice;
    this.variant_status = variant_status;
  }

  async addProductVariant(req, res) {
    try {
      const { product, size, unitPrice, variant_status } = req.body;
      if (!product || !size || !unitPrice || !variant_status) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "INSERT INTO productvariants (variant_id,product_FK,size,unit_price,status) VALUES (?,?,?,?,?)";
      const [result] = await connect.query(sqlQuery, [product, size, unitPrice, variant_status]);
      res.status(201).json({
        data: [{ id: result.insertId, product, size, unitPrice, variant_status }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding ProductVariant", details: error.message });
    }
  }

  async updateProductVariant(req, res) {
    try {
      const { product, size, unitPrice, variant_status } = req.body;
      if (!product || !size || !unitPrice || !variant_status) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE productvariants SET product_FK=?,size=?,unit_price=?,status=?,updatedAt=? WHERE variant_id= ?";
      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");
      const [result] = await connect.query(sqlQuery, [product, size, unitPrice, variant_status, update_at, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "ProductVariant not found" });
      res.status(200).json({
        data: [{ product, size, unitPrice, variant_status, update_at }],
        status: 200,
        updated: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating ProductVariant", details: error.message });
    }
  }

  async deleteProductVariant(req, res) {
    try {
      let sqlQuery = "DELETE FROM productvariants WHERE variant_id = ?";
      const [result] = await connect.query(sqlQuery, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "ProductVariant not found" });
      res.status(200).json({
        data: [],
        status: 200,
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting ProductVariant", details: error.message });
    }
  }

  async showProductVariant(res) {
    try {
      let sqlQuery = "SELECT * FROM productvariants";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching ProductVariants", details: error.message });
    }
  }

  async showProductVariantById(res, req) {
    try {
      const [result] = await connect.query('SELECT * FROM productvariants WHERE variant_id = ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "ProductVariant not found" });
      res.status(200).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Error fetching ProductVariant", details: error.message });
    }
  }

}

export default ProductVariantModel;