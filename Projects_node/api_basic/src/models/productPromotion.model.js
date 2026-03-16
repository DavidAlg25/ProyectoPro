import { connect } from '../config/db/connect.js';

class ProductPromotionModel {
  constructor(id, variant, promotion) {
    this.id = id;
    this.variant = variant;
    this.promotion = promotion;
  }

  async addProductPromotion(req, res) {
    try {
      const { variant, promotion } = req.body;
      if (!variant || !promotion) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "INSERT INTO productpromotion (productPromotion_id,variant_FK,promotion_FK) VALUES (?,?,?)";
      const [result] = await connect.query(sqlQuery, [ variant, promotion ]);
      res.status(201).json({
        data: [{ id: result.insertId, variant, promotion  }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding ProductPromotion", details: error.message });
    }
  }

  async updateProductPromotion(req, res) {
    try {
      const { variant, promotion  } = req.body;
      if (!variant || !promotion) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE productpromotion SET variant_FK=?,promotion_FK=?,updatedAt=? WHERE productPromotion_id= ?";
      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");
      const [result] = await connect.query(sqlQuery, [variant, promotion, update_at, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "ProductPromotion not found" });
      res.status(200).json({
        data: [{ variant, promotion, update_at }],
        status: 200,
        updated: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating ProductPromotion", details: error.message });
    }
  }

  async deleteProductPromotion(req, res) {
    try {
      let sqlQuery = "DELETE FROM productpromotion WHERE productPromotion_id = ?";
      const [result] = await connect.query(sqlQuery, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "ProductPromotion not found" });
      res.status(200).json({
        data: [],
        status: 200,
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting ProductPromotion", details: error.message });
    }
  }

  async showProductPromotion(res) {
    try {
      let sqlQuery = "SELECT * FROM productpromotion";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching ProductPromotions", details: error.message });
    }
  }

  async showProductPromotionById(res, req) {
    try {
      const [result] = await connect.query('SELECT * FROM productpromotion WHERE productPromotion_id = ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "ProductPromotion not found" });
      res.status(200).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Error fetching ProductPromotion", details: error.message });
    }
  }

}

export default ProductPromotionModel;