import { connect } from '../config/db/connect.js';

class InventoryMovementModel {
  constructor(id, variant, invoice, purchase, user, type, quantity, description) {
    this.id = id;
    this.variant = variant;
    this.invoice = invoice;
    this.purchase = purchase;
    this.user = user;
    this.type = type;
    this.quantity = quantity;
    this.description = description;
  }

  // VALIDACIÓN: Variante existe
  async validateVariantExists(variantId) {
    const [result] = await connect.query(
      'SELECT variant_id FROM productvariants WHERE variant_id = ?',
      [variantId]
    );
    return result.length > 0;
  }

  // Obtener movimientos con filtros
  async getMovementsWithFilters(req, res) {
    try {
      const { variantId, type, startDate, endDate, limit = 100 } = req.query;

      let sqlQuery = `
        SELECT im.*, 
               p.product_name, v.size,
               u.login as user_login
        FROM inventorymovement im
        JOIN productvariants v ON im.variant_FK = v.variant_id
        JOIN products p ON v.product_FK = p.product_id
        LEFT JOIN user u ON im.user_FK = u.user_id
        WHERE 1=1
      `;
      
      const params = [];

      if (variantId) {
        sqlQuery += " AND im.variant_FK = ?";
        params.push(variantId);
      }

      if (type) {
        sqlQuery += " AND im.movement_type = ?";
        params.push(type);
      }

      if (startDate) {
        sqlQuery += " AND DATE(im.created_at) >= ?";
        params.push(startDate);
      }

      if (endDate) {
        sqlQuery += " AND DATE(im.created_at) <= ?";
        params.push(endDate);
      }

      sqlQuery += " ORDER BY im.created_at DESC LIMIT ?";
      params.push(parseInt(limit));

      const [result] = await connect.query(sqlQuery, params);

      // Resumen
      const [summary] = await connect.query(`
        SELECT 
          SUM(CASE WHEN movement_type = 'Entrada' THEN quantity ELSE 0 END) as total_entradas,
          SUM(CASE WHEN movement_type = 'Salida' THEN quantity ELSE 0 END) as total_salidas,
          COUNT(*) as total_movimientos
        FROM inventorymovement
      `);

      res.json({
        success: true,
        summary: summary[0],
        data: result
      });

    } catch (error) {
      res.status(500).json({ error: "Error fetching movements", details: error.message });
    }
  }

  // =============================================
  // MÉTODOS CRUD BASE 
  // =============================================

  async addInventoryMovement(req, res) {
    let connection;
    try {
      const { variant, invoice, purchase, user, type, quantity, description } = req.body;

      if (!variant || !type || !quantity || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (quantity <= 0) {
        return res.status(400).json({ error: "La cantidad debe ser mayor a 0" });
      }

      if (!['Entrada', 'Salida'].includes(type)) {
        return res.status(400).json({ error: "Tipo de movimiento inválido" });
      }

      // VALIDACIÓN: Variante existe
      const variantExists = await this.validateVariantExists(variant);
      if (!variantExists) {
        return res.status(400).json({ error: "La variante no existe" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO inventorymovement 
         (variant_FK, invoice_FK, purchase_FK, user_FK, movement_type, quantity, movement_description, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [variant, invoice || null, purchase || null, user || req.user?.user_id, 
         type, quantity, description, req.user?.login || 'system']
      );

      // Actualizar stock en inventory
      const stockOperation = type === 'Entrada' ? '+' : '-';
      await connection.query(
        `UPDATE inventory 
         SET stock = stock ${stockOperation} ?,
             last_modified_by = ?,
             updatedAt = NOW()
         WHERE variant_FK = ?`,
        [quantity, req.user?.login || 'system', variant]
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        data: [{ id: result.insertId, variant, invoice, purchase, user, type, quantity, description }],
        message: "Movimiento registrado exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error adding InventoryMovement", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async updateInventoryMovement(req, res) {
    let connection;
    try {
      const { variant, invoice, purchase, user, type, quantity, description } = req.body;
      const movementId = req.params.id;

      if (!variant || !type || !quantity || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (quantity <= 0) {
        return res.status(400).json({ error: "La cantidad debe ser mayor a 0" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Obtener movimiento actual para ajustar stock
      const [current] = await connection.query(
        'SELECT variant_FK, quantity, movement_type FROM inventorymovement WHERE inventoryMovement_id = ?',
        [movementId]
      );

      if (current.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "InventoryMovement not found" });
      }

      // Revertir el movimiento anterior
      const revertOperation = current[0].movement_type === 'Entrada' ? '-' : '+';
      await connection.query(
        `UPDATE inventory 
         SET stock = stock ${revertOperation} ?,
             last_modified_by = ?,
             updatedAt = NOW()
         WHERE variant_FK = ?`,
        [current[0].quantity, req.user?.login || 'system', current[0].variant_FK]
      );

      // Aplicar el nuevo movimiento
      const newOperation = type === 'Entrada' ? '+' : '-';
      await connection.query(
        `UPDATE inventory 
         SET stock = stock ${newOperation} ?,
             last_modified_by = ?,
             updatedAt = NOW()
         WHERE variant_FK = ?`,
        [quantity, req.user?.login || 'system', variant]
      );

      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");

      const [result] = await connection.query(
        `UPDATE inventorymovement 
         SET variant_FK=?, invoice_FK=?, purchase_FK=?, user_FK=?, movement_type=?, quantity=?, movement_description=?, updatedAt=?, last_modified_by=?
         WHERE inventoryMovement_id=?`,
        [variant, invoice || null, purchase || null, user, type, quantity, description, 
         update_at, req.user?.login || 'system', movementId]
      );

      await connection.commit();

      res.status(200).json({
        success: true,
        data: [{ variant, invoice, purchase, user, type, quantity, description, update_at }],
        message: "Movimiento actualizado exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error updating InventoryMovement", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async deleteInventoryMovement(req, res) {
    let connection;
    try {
      const movementId = req.params.id;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Obtener información del movimiento para revertir stock
      const [movement] = await connection.query(
        'SELECT variant_FK, quantity, movement_type FROM inventorymovement WHERE inventoryMovement_id = ?',
        [movementId]
      );

      if (movement.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "InventoryMovement not found" });
      }

      // Revertir el efecto en el stock
      const revertOperation = movement[0].movement_type === 'Entrada' ? '-' : '+';
      await connection.query(
        `UPDATE inventory 
         SET stock = stock ${revertOperation} ?,
             last_modified_by = ?,
             updatedAt = NOW()
         WHERE variant_FK = ?`,
        [movement[0].quantity, req.user?.login || 'system', movement[0].variant_FK]
      );

      // Eliminar movimiento
      const [result] = await connection.query('DELETE FROM inventorymovement WHERE inventoryMovement_id = ?', [movementId]);

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Movimiento eliminado exitosamente",
        deleted: result.affectedRows
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error deleting InventoryMovement", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async showInventoryMovement(res) {
    try {
      const [result] = await connect.query(`
        SELECT im.*, 
               p.product_name, v.size,
               u.login as user_login
        FROM inventorymovement im
        JOIN productvariants v ON im.variant_FK = v.variant_id
        JOIN products p ON v.product_FK = p.product_id
        LEFT JOIN user u ON im.user_FK = u.user_id
        ORDER BY im.created_at DESC
      `);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching InventoryMovements", details: error.message });
    }
  }

  async showInventoryMovementById(res, req) {
    try {
      const [result] = await connect.query(
        `SELECT im.*, 
                p.product_name, v.size,
                u.login as user_login
         FROM inventorymovement im
         JOIN productvariants v ON im.variant_FK = v.variant_id
         JOIN products p ON v.product_FK = p.product_id
         LEFT JOIN user u ON im.user_FK = u.user_id
         WHERE im.inventoryMovement_id = ?`,
        [req.params.id]
      );

      if (result.length === 0) return res.status(404).json({ error: "InventoryMovement not found" });

      res.status(200).json({
        success: true,
        data: result[0]
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching InventoryMovement", details: error.message });
    }
  }
}

export default InventoryMovementModel;