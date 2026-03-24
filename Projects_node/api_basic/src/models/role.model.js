import { connect } from '../config/db/connect.js';

class RoleModel {
  constructor(id, name, description) {
    this.id = id;
    this.name = name;
    this.description = description;
  }

  // Validar que el nombre sea único
  async validateUniqueName(name, excludeId = null) {
    let sql = 'SELECT role_id FROM role WHERE role_name = ?';
    const params = [name];
    if (excludeId) {
      sql += ' AND role_id != ?';
      params.push(excludeId);
    }
    const [rows] = await connect.query(sql, params);
    return rows.length === 0;
  }

  // Verificar si el rol está siendo utilizado
  async isRoleInUse(roleId) {
    const [rows] = await connect.query(
      'SELECT userAuthority_id FROM userauthority WHERE role_FK = ? LIMIT 1',
      [roleId]
    );
    return rows.length > 0;
  }

  // Roles del sistema que no deben eliminarse (puedes poner los que uses)
  isProtectedRole(roleName) {
    const protectedRoles = ['admin', 'vendedor', 'bodeguero', 'cliente'];
    return protectedRoles.includes(roleName.toLowerCase());
  }

  async addRole(req, res) {
    try {
      const { name, description } = req.body;
      if (!name || !description) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
      }

      // Validar unicidad
      const isUnique = await this.validateUniqueName(name);
      if (!isUnique) {
        return res.status(400).json({ error: "Ya existe un rol con ese nombre" });
      }

      const [result] = await connect.query(
        'INSERT INTO role (role_name, role_description) VALUES (?, ?)',
        [name, description]
      );

      res.status(201).json({
        success: true,
        data: [{ id: result.insertId, name, description }]
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding Role", details: error.message });
    }
  }

  async updateRole(req, res) {
    try {
      const { name, description } = req.body;
      const roleId = req.params.id;

      if (!name || !description) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
      }

      // Validar unicidad (excluyendo este rol)
      const isUnique = await this.validateUniqueName(name, roleId);
      if (!isUnique) {
        return res.status(400).json({ error: "Ya existe un rol con ese nombre" });
      }

      const [result] = await connect.query(
        'UPDATE role SET role_name = ?, role_description = ? WHERE role_id = ?',
        [name, description, roleId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Rol no encontrado" });
      }

      res.status(200).json({
        success: true,
        data: [{ name, description }]
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating Role", details: error.message });
    }
  }

  async deleteRole(req, res) {
    try {
      const roleId = req.params.id;

      // Obtener el nombre del rol para saber si es protegido
      const [role] = await connect.query('SELECT role_name FROM role WHERE role_id = ?', [roleId]);
      if (role.length === 0) {
        return res.status(404).json({ error: "Rol no encontrado" });
      }

      if (this.isProtectedRole(role[0].role_name)) {
        return res.status(400).json({ error: "No se puede eliminar un rol del sistema" });
      }

      // Verificar si está en uso
      const inUse = await this.isRoleInUse(roleId);
      if (inUse) {
        return res.status(400).json({ error: "No se puede eliminar el rol porque está asignado a uno o más usuarios" });
      }

      const [result] = await connect.query('DELETE FROM role WHERE role_id = ?', [roleId]);

      res.status(200).json({
        success: true,
        message: "Rol eliminado exitosamente",
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting Role", details: error.message });
    }
  }

  // Los métodos showRole y showRoleById se mantienen igual (solo lectura)
  async showRole(res) {
    try {
      const [result] = await connect.query('SELECT * FROM role');
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ error: "Error fetching Roles", details: error.message });
    }
  }

  async showRoleById(res, req) {
    try {
      const [result] = await connect.query('SELECT * FROM role WHERE role_id = ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "Rol no encontrado" });
      res.status(200).json({ success: true, data: result[0] });
    } catch (error) {
      res.status(500).json({ error: "Error fetching Role", details: error.message });
    }
  }
}

export default RoleModel;