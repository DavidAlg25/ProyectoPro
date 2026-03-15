import { act } from 'react';
import { connect } from '../config/db/connect.js';
import { encryptPassword } from '../library/appBcrypt.js';

class UserModel {
  constructor(id, login, password, email, image_url, activated, lang_key, activation_key, reset_key, reset_date, created_by, last_modify_by) {
    this.id = id;
    this.login = login;
    this.password = password;
    this.email = email;
    this.image_url = image_url;
    this.activated = activated;
    this.lang_key = lang_key;
    this.activation_key = activation_key;
    this.reset_key = reset_key;
    this.reset_date = reset_date;
    this.created_by = created_by;
    this.last_modify_by = last_modify_by;
  }

  async addUser(req, res) {
    try {
      const { login, password, email, image_url, activated, lang_key, activation_key, reset_key, reset_date, created_by, last_modify_by } = req.body;
      if (!login || !password || !email || !image_url || !activated || !lang_key || !activation_key || !reset_key || !reset_date || !created_by || !last_modify_by) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const hashedPassword = await encryptPassword(password);
      let sqlQuery = "INSERT INTO user (user_id,login,password,email,image_url,activated,lang_key,activation_key,reset_key,reset_date,created_by,last_modified_by ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";
      const [result] = await connect.query(sqlQuery, [login, hashedPassword, email, image_url, activated, lang_key, activation_key, reset_key, reset_date, created_by, last_modify_by]);
      res.status(201).json({
        data: [{ id: result.insertId, login, hashedPassword, email, image_url, activated, lang_key, activation_key, reset_key, reset_date, created_by, last_modify_by }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding user", details: error.message });
    }
  }

  async updateUser(req, res) {
    try {
      const { login, password, email, image_url, activated, lang_key, activation_key, reset_key, reset_date, created_by, last_modify_by } = req.body;
      if (!login || !password || !email || !image_url || !activated || !lang_key || !activation_key || !reset_key || !reset_date || !created_by || !last_modify_by) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE user SET user_id=? ,login=?,password=?,email=?,image_url=?,activated=?,lang_key=?,activation_key=?,reset_key=?,reset_date=?,created_by=?,last_modified_by=?,updatedAt=? WHERE user_id= ?";
      const updated_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");
      const [result] = await connect.query(sqlQuery, [login, password, email, image_url, activated, lang_key, activation_key, reset_key, reset_date, created_by, last_modify_by, updated_at, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "user not found" });
      res.status(200).json({
        data: [{ login, email, image_url, activated, lang_key, activation_key, reset_key, reset_date, created_by, last_modify_by, updated_at }],
        status: 200,
        updated: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating user", details: error.message });
    }
  }

  async deleteUser(req, res) {
    try {
      let sqlQuery = "DELETE FROM user WHERE user_id = ?";
      const [result] = await connect.query(sqlQuery, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "user not found" });
      res.status(200).json({
        data: [],
        status: 200,
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting user", details: error.message });
    }
  }

  async showUser(res) {
    try {
      let sqlQuery = "SELECT * FROM user";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching users", details: error.message });
    }
  }

  async showUserById(res, req) {
    try {
      const [result] = await connect.query('SELECT * FROM user WHERE user_id = ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "user not found" });
      res.status(200).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Error fetching user", details: error.message });
    }
  }

}

export default UserModel;