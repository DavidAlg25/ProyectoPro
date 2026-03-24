import { connect } from '../config/db/connect.js';
import { encryptPassword } from '../library/appBcrypt.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

class AuthModel {
  
  // VALIDACIÓN: Login único
  async validateUniqueLogin(login, excludeId = null) {
    let sqlQuery = "SELECT user_id FROM user WHERE login = ?";
    const params = [login];
    
    if (excludeId) {
      sqlQuery += " AND user_id != ?";
      params.push(excludeId);
    }
    
    const [result] = await connect.query(sqlQuery, params);
    return result.length === 0;
  }

  // VALIDACIÓN: Email único
  async validateUniqueEmail(email, excludeId = null) {
    let sqlQuery = "SELECT user_id FROM user WHERE email = ?";
    const params = [email];
    
    if (excludeId) {
      sqlQuery += " AND user_id != ?";
      params.push(excludeId);
    }
    
    const [result] = await connect.query(sqlQuery, params);
    return result.length === 0;
  }

  // VALIDACIÓN: Documento único por tipo
  async validateUniqueDocument(doc_type_id, document_number, excludeId = null) {
    let sqlQuery = "SELECT customer_id FROM customer WHERE doc_type_id = ? AND document_number = ?";
    const params = [doc_type_id, document_number];
    
    if (excludeId) {
      sqlQuery += " AND customer_id != ?";
      params.push(excludeId);
    }
    
    const [result] = await connect.query(sqlQuery, params);
    return result.length === 0;
  }

  // VALIDACIÓN: Tipo de documento existe
  async validateDocumentTypeExists(doc_type_id) {
    const [result] = await connect.query(
      'SELECT doc_type_id FROM documenttype WHERE doc_type_id = ?',
      [doc_type_id]
    );
    return result.length > 0;
  }

  // Obtener rol cliente
  async getClienteRoleId() {
    const [result] = await connect.query(
      'SELECT role_id FROM role WHERE role_name = "cliente"'
    );
    return result.length > 0 ? result[0].role_id : null;
  }

  // Método auxiliar para generar token aleatorio
  generateResetToken() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  // REGISTRO COMPLETO (usuario + cliente + rol)
  async register(req, res) {
    let connection;
    try {
      const { 
        login, password, email, lang_key, image_url,
        doc_type_id, document_number, 
        first_name, second_name, first_last_name, second_last_name 
      } = req.body;

      // Validar campos requeridos
      if (!login || !password || !email || !doc_type_id || !document_number || 
          !first_name || !first_last_name) {
        return res.status(400).json({ 
          error: "Faltan campos requeridos: login, password, email, tipo documento, número documento, nombre y apellido son obligatorios" 
        });
      }

      // VALIDACIÓN 1: Login único
      const isLoginUnique = await this.validateUniqueLogin(login);
      if (!isLoginUnique) {
        return res.status(400).json({ error: "El nombre de usuario ya está en uso" });
      }

      // VALIDACIÓN 2: Email único
      const isEmailUnique = await this.validateUniqueEmail(email);
      if (!isEmailUnique) {
        return res.status(400).json({ error: "El email ya está registrado" });
      }

      // VALIDACIÓN 3: Tipo de documento existe
      const docTypeExists = await this.validateDocumentTypeExists(doc_type_id);
      if (!docTypeExists) {
        return res.status(400).json({ error: "El tipo de documento no es válido" });
      }

      // VALIDACIÓN 4: Documento único por tipo
      const isDocUnique = await this.validateUniqueDocument(doc_type_id, document_number);
      if (!isDocUnique) {
        return res.status(400).json({ error: "Ya existe un cliente con este documento" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // 1. Encriptar password
      const hashedPassword = await encryptPassword(password);

      // 2. Crear usuario
      const [userResult] = await connection.query(
        `INSERT INTO user 
         (login, password, email, image_url, activated, lang_key, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          login, 
          hashedPassword, 
          email, 
          image_url || null, 
          false, // activated = false hasta confirmar email
          lang_key || 'es', 
          login // created_by = el mismo usuario
        ]
      );

      const userId = userResult.insertId;

      // 3. Crear cliente
      const [customerResult] = await connection.query(
        `INSERT INTO customer 
         (user_FK, doc_type_id, document_number, first_name, second_name, first_last_name, second_last_name) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          doc_type_id,
          document_number,
          first_name,
          second_name || null,
          first_last_name,
          second_last_name || null
        ]
      );

      // 4. Asignar rol "cliente"
      const clienteRoleId = await this.getClienteRoleId();
      if (clienteRoleId) {
        await connection.query(
          'INSERT INTO userauthority (user_FK, role_FK) VALUES (?, ?)',
          [userId, clienteRoleId]
        );
      }

      // 5. Crear carrito de compras para el cliente
      await connection.query(
        `INSERT INTO shoppingcart (customer_FK, shoppingCart_status) 
         VALUES (?, 'Activo')`,
        [customerResult.insertId]
      );

      await connection.commit();

      // Generar token de activación (opcional)
      const activationToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });

      await connection.query(
  'UPDATE user SET activation_key = ? WHERE user_id = ?',
  [activationToken, userId]);

      res.status(201).json({
        success: true,
        message: "Registro exitoso. Por favor verifica tu email para activar tu cuenta.",
        data: {
          user_id: userId,
          login,
          email,
          customer_id: customerResult.insertId
        }
      });

    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error en registro:', error);
      res.status(500).json({ error: "Error en el registro", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  // ACTIVAR CUENTA
  async activateAccount(req, res) {
    let connection;
    try {
      const { token } = req.params;
      
      // Verificar token (implementar según tu lógica)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      connection = await connect.getConnection();
      await connection.beginTransaction();

      const [result] = await connection.query(
  'UPDATE user SET activated = true WHERE activation_key = ? AND activated = false',
  [token]
);

      /*[result] = await connection.query(
        'UPDATE user SET activated = true WHERE user_id = ? AND activated = false',
        [req.params.userId] // Ajustar según tu lógica de token
      );*/

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(400).json({ error: "Token inválido o cuenta ya activada" });
      }

      await connection.commit();

      res.json({
        success: true,
        message: "Cuenta activada exitosamente. Ya puedes iniciar sesión."
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error activando cuenta", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  // OBTENER PERFIL DEL CLIENTE
  async getProfile(req, res) {
    try {
      const userId = req.user.user_id;

      const [result] = await connect.query(
        `SELECT 
           u.user_id, u.login, u.email, u.image_url, u.lang_key, u.activated,
           c.customer_id, c.doc_type_id, c.document_number,
           c.first_name, c.second_name, c.first_last_name, c.second_last_name,
           dt.code as doc_type_code, dt.description as doc_type_description
         FROM user u
         INNER JOIN customer c ON u.user_id = c.user_FK
         LEFT JOIN documenttype dt ON c.doc_type_id = dt.doc_type_id
         WHERE u.user_id = ?`,
        [userId]
      );

      if (result.length === 0) {
        return res.status(404).json({ error: "Perfil no encontrado" });
      }

      res.json({
        success: true,
        data: result[0]
      });

    } catch (error) {
      res.status(500).json({ error: "Error obteniendo perfil", details: error.message });
    }
  }


// Solicitar restablecimiento de contraseña (envío de token por email)
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email requerido" });

      const [user] = await connect.query('SELECT user_id, login FROM user WHERE email = ?', [email]);
      if (user.length === 0) {
        // Por seguridad, no revelamos si el email existe o no
        return res.json({ success: true, message: "Si el email está registrado, recibirás un enlace para restablecer tu contraseña." });
      }

      // Generar token (podría ser JWT o string aleatorio)
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hora

      // Guardar token en BD 
      await connect.query(
        'UPDATE user SET reset_key = ?, reset_date = ? WHERE user_id = ?',
        [resetToken, expiresAt, user[0].user_id]
      );

      // Aquí enviarías el correo con el enlace
      // Ejemplo: https://tudominio.com/reset-password?token=resetToken
      // Por ahora simulamos
      console.log(`Enlace de restablecimiento para ${email}: /reset-password?token=${resetToken}`);

      res.json({
        success: true,
        message: "Si el email está registrado, recibirás un enlace para restablecer tu contraseña."
      });

    } catch (error) {
      res.status(500).json({ error: "Error solicitando restablecimiento", details: error.message });
    }
  }

  // Restablecer contraseña con token
  async resetPassword(req, res) {
    let connection;
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token y nueva contraseña requeridos" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Buscar usuario con ese token y fecha no expirada
      const [user] = await connection.query(
        'SELECT user_id, login FROM user WHERE reset_key = ? AND reset_date > NOW()',
        [token]
      );
      if (user.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: "Token inválido o expirado" });
      }

      const hashedPassword = await encryptPassword(newPassword);

      await connection.query(
        'UPDATE user SET password = ?, reset_key = NULL, reset_date = NULL, last_modified_by = ? WHERE user_id = ?',
        [hashedPassword, user[0].login, user[0].user_id]
      );

      await connection.commit();

      res.json({ success: true, message: "Contraseña restablecida exitosamente" });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error restableciendo contraseña", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  // ACTUALIZAR PERFIL
  async updateProfile(req, res) {
    let connection;
    try {
      const userId = req.user.user_id;
      const { 
        image_url, lang_key,
        first_name, second_name, first_last_name, second_last_name 
      } = req.body;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Actualizar datos de usuario
      if (image_url || lang_key) {
        await connection.query(
          'UPDATE user SET image_url = ?, lang_key = ?, last_modified_by = ? WHERE user_id = ?',
          [image_url, lang_key, req.user.login, userId]
        );
      }

      // Actualizar datos de cliente
      if (first_name || first_last_name) {
        await connection.query(
          `UPDATE customer 
           SET first_name = ?, second_name = ?, first_last_name = ?, second_last_name = ? 
           WHERE user_FK = ?`,
          [first_name, second_name, first_last_name, second_last_name, userId]
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: "Perfil actualizado exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error actualizando perfil", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }
}

export default new AuthModel();