import { connect } from '../config/db/connect.js';
import { comparePassword } from '../library/appBcrypt.js';
import jwt from 'jsonwebtoken';
import AuthModel from '../models/auth.model.js';

class AuthController {
  
  // =============================================
  // REGISTRO PÚBLICO
  // =============================================
  async register(req, res) {
    try {
      await AuthModel.register(req, res);
    } catch (error) {
      res.status(500).json({ error: "Error en registro", details: error.message });
    }
  }

  // =============================================
  // LOGIN PÚBLICO
  // =============================================
  async login(req, res) {
    try {
      const { login, password } = req.body;

      if (!login || !password) {
        return res.status(400).json({ 
          error: "Login y password son requeridos" 
        });
      }

      // Obtener usuario por login
      const [userRows] = await connect.query(
        'SELECT * FROM user WHERE login = ?', 
        [login]
      );

      if (userRows.length === 0) {
        return res.status(401).json({ 
          error: "Credenciales inválidas" 
        });
      }

      const user = userRows[0];

      // Verificar si el usuario está activado
      if (!user.activated) {
        return res.status(403).json({ 
          error: "Usuario no está activado. Por favor verifica tu email." 
        });
      }

      // Verificar contraseña
      const validPassword = await comparePassword(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ 
          error: "Credenciales inválidas" 
        });
      }

      // Obtener roles del usuario
      const [roleRows] = await connect.query(`
        SELECT r.role_id, r.role_name, r.role_description
        FROM role r
        INNER JOIN userauthority ua ON r.role_id = ua.role_FK
        WHERE ua.user_FK = ?
      `, [user.user_id]);

      // Crear payload del token
      const payload = {
        user_id: user.user_id,
        login: user.login,
        email: user.email,
        roles: roleRows,
        activated: user.activated
      };

      // Generar token
      const token = jwt.sign(
        payload, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
      );

      res.json({
        success: true,
        token,
        user: {
          user_id: user.user_id,
          login: user.login,
          email: user.email,
          image_url: user.image_url,
          roles: roleRows
        }
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ 
        error: "Error en el servidor", 
        details: error.message 
      });
    }
  }

  // auth.controller.js

async requestPasswordReset(req, res) {
  try {
    await AuthModel.requestPasswordReset(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error solicitando restablecimiento", details: error.message });
  }
}

async resetPassword(req, res) {
  try {
    await AuthModel.resetPassword(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error restableciendo contraseña", details: error.message });
  }
}

  // =============================================
  // LOGOUT PÚBLICO
  // =============================================
  async logout(req, res) {
    res.json({ 
      success: true, 
      message: "Sesión cerrada exitosamente" 
    });
  }

  // =============================================
  // PERFIL - SOLO USUARIO AUTENTICADO
  // =============================================
  async getProfile(req, res) {
    try {
      await AuthModel.getProfile(req, res);
    } catch (error) {
      res.status(500).json({ error: "Error obteniendo perfil", details: error.message });
    }
  }

  // =============================================
  // ACTUALIZAR PERFIL - SOLO USUARIO AUTENTICADO
  // =============================================
  async updateProfile(req, res) {
    try {
      await AuthModel.updateProfile(req, res);
    } catch (error) {
      res.status(500).json({ error: "Error actualizando perfil", details: error.message });
    }
  }

  // =============================================
  // ACTIVAR CUENTA - PÚBLICO (con token)
  // =============================================
  async activateAccount(req, res) {
    try {
      await AuthModel.activateAccount(req, res);
    } catch (error) {
      res.status(500).json({ error: "Error activando cuenta", details: error.message });
    }
  }
}

export default new AuthController();