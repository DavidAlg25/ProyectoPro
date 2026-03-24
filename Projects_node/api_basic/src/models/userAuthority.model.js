import { connect } from '../config/db/connect.js';

class UserAuthorityModel {
  constructor(id, user, role) {
    this.id = id;
    this.user = user;
    this.role = role;
  }

  // Verificar que el usuario existe
  async validateUserExists(userId) {
    const [result] = await connect.query('SELECT user_id FROM user WHERE user_id = ?', [userId]);
    return result.length > 0;
  }

  // Verificar que el rol existe
  async validateRoleExists(roleId) {
    const [result] = await connect.query('SELECT role_id FROM role WHERE role_id = ?', [roleId]);
    return result.length > 0;
  }

  // Verificar que no exista ya una asignación para el mismo usuario y rol
  async validateNoDuplicate(userId, roleId, excludeId = null) {
    let sql = 'SELECT userAuthority_id FROM userauthority WHERE user_FK = ? AND role_FK = ?';
    const params = [userId, roleId];
    if (excludeId) {
      sql += ' AND userAuthority_id != ?';
      params.push(excludeId);
    }
    const [result] = await connect.query(sql, params);
    return result.length === 0;
  }

  async addUserAuthority(req, res) {
    try {
      const { user, role } = req.body;
      if (!user || !role) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
      }

      // Validaciones
      const userExists = await this.validateUserExists(user);
      if (!userExists) {
        return res.status(400).json({ error: "El usuario no existe" });
      }
      const roleExists = await this.validateRoleExists(role);
      if (!roleExists) {
        return res.status(400).json({ error: "El rol no existe" });
      }
      const noDuplicate = await this.validateNoDuplicate(user, role);
      if (!noDuplicate) {
        return res.status(400).json({ error: "El usuario ya tiene este rol asignado" });
      }

      const [result] = await connect.query(
        'INSERT INTO userauthority (user_FK, role_FK) VALUES (?, ?)',
        [user, role]
      );
      res.status(201).json({
        success: true,
        data: { id: result.insertId, user, role }
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding userAuthority", details: error.message });
    }
  }

  async updateUserAuthority(req, res) {
    try {
      const { user, role } = req.body;
      const id = req.params.id;
      if (!user || !role) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
      }

      // Validar existencia
      const userExists = await this.validateUserExists(user);
      if (!userExists) {
        return res.status(400).json({ error: "El usuario no existe" });
      }
      const roleExists = await this.validateRoleExists(role);
      if (!roleExists) {
        return res.status(400).json({ error: "El rol no existe" });
      }
      const noDuplicate = await this.validateNoDuplicate(user, role, id);
      if (!noDuplicate) {
        return res.status(400).json({ error: "El usuario ya tiene este rol asignado (otro registro)" });
      }

      const [result] = await connect.query(
        'UPDATE userauthority SET user_FK = ?, role_FK = ? WHERE userAuthority_id = ?',
        [user, role, id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Asignación no encontrada" });
      }
      res.status(200).json({
        success: true,
        data: { user, role }
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating userAuthority", details: error.message });
    }
  }

  async deleteUserAuthority(req, res) {
    try {
      const id = req.params.id;
      const [result] = await connect.query('DELETE FROM userauthority WHERE userAuthority_id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Asignación no encontrada" });
      }
      res.status(200).json({
        success: true,
        message: "Asignación eliminada exitosamente"
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting userAuthority", details: error.message });
    }
  }

  async showUserAuthority(res) {
    try {
      const [result] = await connect.query(`
        SELECT ua.*, u.login, r.role_name
        FROM userauthority ua
        JOIN user u ON ua.user_FK = u.user_id
        JOIN role r ON ua.role_FK = r.role_id
      `);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ error: "Error fetching userAuthority", details: error.message });
    }
  }

  async showUserAuthorityById(res, req) {
    try {
      const [result] = await connect.query(`
        SELECT ua.*, u.login, r.role_name
        FROM userauthority ua
        JOIN user u ON ua.user_FK = u.user_id
        JOIN role r ON ua.role_FK = r.role_id
        WHERE ua.userAuthority_id = ?
      `, [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "Asignación no encontrada" });
      res.status(200).json({ success: true, data: result[0] });
    } catch (error) {
      res.status(500).json({ error: "Error fetching userAuthority", details: error.message });
    }
  }
}

export default UserAuthorityModel;