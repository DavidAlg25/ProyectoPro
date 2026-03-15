import { connect } from '../config/db/connect.js';

class UserAuthorityModel {
  constructor(id, user, role) {
    this.id = id;
    this.user = user;
    this.role = role;
  }

  async addUserAuthority(req, res) {
    try {
      const { user, role } = req.body;
      if (!user || !role) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "INSERT INTO userauthority (userAuthority_id,user_FK,role_FK ) VALUES (?,?,?)";
      const [result] = await connect.query(sqlQuery, [user, role]);
      res.status(201).json({
        data: [{ id: result.insertId, user, role }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding userAuthority", details: error.message });
    }
  }

  async updateUserAuthority(req, res) {
    try {
      const { user, role } = req.body;
      if (!user || !role) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE userauthority SET user_FK=?,role_FK=? WHERE userAuthority_id= ?";
      const [result] = await connect.query(sqlQuery, [user, role, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "userAuthority not found" });
      res.status(200).json({
        data: [{ user, role}],
        status: 200,
        updated: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating userAuthority", details: error.message });
    }
  }

  async deleteUserAuthority(req, res) {
    try {
      let sqlQuery = "DELETE FROM userauthority WHERE userAuthority_id = ?";
      const [result] = await connect.query(sqlQuery, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "userAuthority not found" });
      res.status(200).json({
        data: [],
        status: 200,
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting userAuthority", details: error.message });
    }
  }

  async showUserAuthority(res) {
    try {
      let sqlQuery = "SELECT * FROM userauthority";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching userAuthority", details: error.message });
    }
  }

  async showUserAuthorityById(res, req) {
    try {
      const [result] = await connect.query('SELECT * FROM userauthority WHERE userAuthority_id = ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "userAuthority not found" });
      res.status(200).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Error fetching userAuthority", details: error.message });
    }
  }

}

export default UserAuthorityModel;