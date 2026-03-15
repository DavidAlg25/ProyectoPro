import { connect } from '../config/db/connect.js';
import { comparePassword } from '../library/appBcrypt.js';
import jwt from 'jsonwebtoken';

class AuthController {
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
          error: "Usuario no está activado" 
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

      // Crear payload del token (sin información sensible)
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

  async logout(req, res) {
    // Como usamos JWT, el logout se maneja del lado del cliente
    // Solo podemos enviar una respuesta exitosa
    res.json({ 
      success: true, 
      message: "Sesión cerrada exitosamente" 
    });
  }

}

export default new AuthController();