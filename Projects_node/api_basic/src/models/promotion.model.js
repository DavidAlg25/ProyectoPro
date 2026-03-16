import { connect } from '../config/db/connect.js';

class PromotionModel {
  constructor(id, title, description, discount, start_date, end_date) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.discount = discount;
    this.start_date = start_date;
    this.end_date = end_date;
  }

  async addPromotion(req, res) {
    try {
      const { title, description, discount, start_date, end_date } = req.body;
      if (!title || !description || !discount || !start_date || !end_date) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "INSERT INTO promotion (promotion_id,promotion_title,promotion_description,promotion_discount,start_date,end_date) VALUES (?,?,?,?,?,?)";
      const [result] = await connect.query(sqlQuery, [title, description, discount, start_date, end_date]);
      res.status(201).json({
        data: [{ id: result.insertId, title, description, discount, start_date, end_date }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding Promotion", details: error.message });
    }
  }

  async updatePromotion(req, res) {
    try {
      const { title, description, discount, start_date, end_date } = req.body;
      if (!title || !description || !discount || !start_date || !end_date) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE promotion SET promotion_title=?,promotion_description=?,promotion_discount=?,start_date=?,end_date=?,updatedAt=? WHERE promotion_id= ?";
      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");
      const [result] = await connect.query(sqlQuery, [title, description, discount, start_date, end_date, update_at, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Promotion not found" });
      res.status(200).json({
        data: [{ title, description, discount, start_date, end_date, update_at }],
        status: 200,
        updated: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating Promotion", details: error.message });
    }
  }

  async deletePromotion(req, res) {
    try {
      let sqlQuery = "DELETE FROM promotion WHERE promotion_id = ?";
      const [result] = await connect.query(sqlQuery, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Promotion not found" });
      res.status(200).json({
        data: [],
        status: 200,
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting Promotion", details: error.message });
    }
  }

  async showPromotion(res) {
    try {
      let sqlQuery = "SELECT * FROM promotion";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching Promotions", details: error.message });
    }
  }

  async showPromotionById(res, req) {
    try {
      const [result] = await connect.query('SELECT * FROM promotion WHERE promotion_id = ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "Promotion not found" });
      res.status(200).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Error fetching Promotion", details: error.message });
    }
  }

}

export default PromotionModel;