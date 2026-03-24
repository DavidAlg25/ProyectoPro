import { connect } from '../config/db/connect.js';
import { encryptPassword } from '../library/appBcrypt.js';

class UserModel {
  constructor() {  }

  // Validar login único
  async validateUniqueLogin(login, excludeId = null) {
    let sql = 'SELECT user_id FROM user WHERE login = ?';
    const params = [login];
    if (excludeId) {
      sql += ' AND user_id != ?';
      params.push(excludeId);
    }
    const [rows] = await connect.query(sql, params);
    return rows.length === 0;
  }

  // Validar email único
  async validateUniqueEmail(email, excludeId = null) {
    let sql = 'SELECT user_id FROM user WHERE email = ?';
    const params = [email];
    if (excludeId) {
      sql += ' AND user_id != ?';
      params.push(excludeId);
    }
    const [rows] = await connect.query(sql, params);
    return rows.length === 0;
  }

  // Verificar si el usuario tiene registros asociados (para no eliminarlo físicamente)
  async hasRelatedRecords(userId) {
    // Cliente asociado (si existe)
    const [customer] = await connect.query(
      'SELECT customer_id FROM customer WHERE user_FK = ? LIMIT 1',
      [userId]
    );
    if (customer.length) return true;

    // Órdenes
    const [orders] = await connect.query(
      'SELECT order_id FROM `order` WHERE customer_FK IN (SELECT customer_id FROM customer WHERE user_FK = ?) LIMIT 1',
      [userId]
    );
    if (orders.length) return true;

    // Pagos creados por el usuario
    const [payments] = await connect.query(
      'SELECT payment_id FROM payment WHERE created_by = ? LIMIT 1',
      [userId]
    );
    if (payments.length) return true;

    // Movimientos de inventario
    const [movements] = await connect.query(
      'SELECT inventoryMovement_id FROM inventorymovement WHERE user_FK = ? LIMIT 1',
      [userId]
    );
    return movements.length > 0;
  }

  async addUser(req, res) {
    try {
      const { login, password, email, image_url, activated, lang_key, activation_key, reset_key, reset_date, created_by, last_modify_by } = req.body;

      // Campos obligatorios
      if (!login || !password || !email) {
        return res.status(400).json({ error: "Login, password y email son obligatorios" });
      }

      // Validar unicidad
      const isLoginUnique = await this.validateUniqueLogin(login);
      if (!isLoginUnique) {
        return res.status(400).json({ error: "El nombre de usuario ya está en uso" });
      }
      const isEmailUnique = await this.validateUniqueEmail(email);
      if (!isEmailUnique) {
        return res.status(400).json({ error: "El email ya está registrado" });
      }

      const hashedPassword = await encryptPassword(password);

      const [result] = await connect.query(
        `INSERT INTO user 
         (login, password, email, image_url, activated, lang_key, activation_key, reset_key, reset_date, created_by, last_modified_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [login, hashedPassword, email, image_url || null, activated || false, lang_key || 'es', 
         activation_key || null, reset_key || null, reset_date || null, created_by || login, last_modify_by || login]
      );

      res.status(201).json({
        success: true,
        data: { id: result.insertId, login, email }
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding user", details: error.message });
    }
  }

  async updateUser(req, res) {
    try {
      const { login, password, email, image_url, activated, lang_key, activation_key, reset_key, reset_date, created_by, last_modify_by } = req.body;
      const userId = req.params.id;

      if (!login || !email) {
        return res.status(400).json({ error: "Login y email son obligatorios" });
      }

      // Validar unicidad (excluyendo el usuario actual)
      const isLoginUnique = await this.validateUniqueLogin(login, userId);
      if (!isLoginUnique) {
        return res.status(400).json({ error: "El nombre de usuario ya está en uso" });
      }
      const isEmailUnique = await this.validateUniqueEmail(email, userId);
      if (!isEmailUnique) {
        return res.status(400).json({ error: "El email ya está registrado" });
      }

      // Si se envía password, encriptarlo
      let hashedPassword = null;
      if (password) {
        hashedPassword = await encryptPassword(password);
      }

      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota", hour12: false }).replace(",", "").replace("/", "-").replace("/", "-");
      const lastModifyBy = last_modify_by || req.user?.login || 'system';

      // Construir consulta dinámica según campos enviados
      const fields = [];
      const params = [];

      fields.push("login = ?"); params.push(login);
      fields.push("email = ?"); params.push(email);
      if (hashedPassword) {
        fields.push("password = ?"); params.push(hashedPassword);
      }
      if (image_url !== undefined) {
        fields.push("image_url = ?"); params.push(image_url);
      }
      if (activated !== undefined) {
        fields.push("activated = ?"); params.push(activated);
      }
      if (lang_key !== undefined) {
        fields.push("lang_key = ?"); params.push(lang_key);
      }
      if (activation_key !== undefined) {
        fields.push("activation_key = ?"); params.push(activation_key);
      }
      if (reset_key !== undefined) {
        fields.push("reset_key = ?"); params.push(reset_key);
      }
      if (reset_date !== undefined) {
        fields.push("reset_date = ?"); params.push(reset_date);
      }
      if (created_by !== undefined) {
        fields.push("created_by = ?"); params.push(created_by);
      }
      fields.push("last_modified_by = ?"); params.push(lastModifyBy);
      fields.push("updatedAt = ?"); params.push(update_at);
      params.push(userId);

      const sql = `UPDATE user SET ${fields.join(", ")} WHERE user_id = ?`;
      const [result] = await connect.query(sql, params);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.status(200).json({
        success: true,
        data: { login, email, updated_at: update_at }
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating user", details: error.message });
    }
  }

  async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      // 1. Verificar si el usuario tiene registros asociados
      const hasRecords = await this.hasRelatedRecords(userId);
      if (hasRecords) {
        return res.status(400).json({ 
          error: "No se puede eliminar el usuario porque tiene registros asociados (pedidos, facturas, etc.)"
        });
      }

      // 2. Si no tiene registros, eliminar físicamente
      const [result] = await connect.query('DELETE FROM user WHERE user_id = ?', [userId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.status(200).json({
        success: true,
        message: "Usuario eliminado exitosamente"
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting user", details: error.message });
    }
  }

  // Los métodos de lectura se mantienen igual (no requieren cambios)
  async showUser(res) {
    try {
      const [result] = await connect.query('SELECT user_id, login, email, image_url, activated, lang_key, createdAt, updatedAt FROM user');
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ error: "Error fetching users", details: error.message });
    }
  }

  async showUserById(res, req) {
    try {
      const [result] = await connect.query(
        'SELECT user_id, login, email, image_url, activated, lang_key, createdAt, updatedAt FROM user WHERE user_id = ?',
        [req.params.id]
      );
      if (result.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
      res.status(200).json({ success: true, data: result[0] });
    } catch (error) {
      res.status(500).json({ error: "Error fetching user", details: error.message });
    }
  }
}

export default UserModel;