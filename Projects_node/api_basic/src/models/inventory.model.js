import { connect } from '../config/db/connect.js';

class InventoryModel {
  constructor(id, variant, stock, min_stock, max_stock, is_active) {
    this.id = id;
    this.variant = variant;
    this.stock = stock;
    this.min_stock = min_stock;
    this.max_stock = max_stock;
    this.is_active = is_active;
  }

  // VALIDACIÓN: Variante existe
  async validateVariantExists(variantId) {
    const [result] = await connect.query(
      'SELECT variant_id FROM productvariants WHERE variant_id = ?',
      [variantId]
    );
    return result.length > 0;
  }

  // Obtener inventario con alertas
  async getInventoryWithAlerts(req, res) {
    try {
      const [result] = await connect.query(`
        SELECT i.*, 
               p.product_name, v.size,
               CASE 
                 WHEN i.stock <= i.min_stock THEN 'BAJO'
                 WHEN i.stock >= i.max_stock THEN 'EXCESO'
                 ELSE 'NORMAL'
               END as alert_level,
               (i.stock - i.min_stock) as stock_to_reorder
        FROM inventory i
        JOIN productvariants v ON i.variant_FK = v.variant_id
        JOIN products p ON v.product_FK = p.product_id
        ORDER BY alert_level DESC, i.stock ASC
      `);

      const summary = {
        total_variants: result.length,
        low_stock: result.filter(r => r.alert_level === 'BAJO').length,
        excess_stock: result.filter(r => r.alert_level === 'EXCESO').length,
        normal: result.filter(r => r.alert_level === 'NORMAL').length
      };

      res.json({
        success: true,
        summary,
        data: result
      });

    } catch (error) {
      res.status(500).json({ error: "Error fetching inventory with alerts", details: error.message });
    }
  }

  // Actualizar stock (uso interno)
  async updateStock(variantId, quantity, operation, userId, description) {
    let connection;
    try {
      connection = await connect.getConnection();
      await connection.beginTransaction();

      const [current] = await connection.query(
        'SELECT stock FROM inventory WHERE variant_FK = ?',
        [variantId]
      );

      if (current.length === 0) {
        throw new Error("Inventario no encontrado para la variante");
      }

      const newStock = operation === 'add' 
        ? current[0].stock + quantity 
        : current[0].stock - quantity;

      if (newStock < 0) {
        throw new Error("Stock no puede ser negativo");
      }

      await connection.query(
        'UPDATE inventory SET stock = ?, last_modified_by = ?, updatedAt = NOW() WHERE variant_FK = ?',
        [newStock, userId, variantId]
      );

      await connection.query(
        `INSERT INTO inventorymovement 
         (variant_FK, user_FK, movement_type, quantity, movement_description) 
         VALUES (?, ?, ?, ?, ?)`,
        [variantId, userId, operation === 'add' ? 'Entrada' : 'Salida', quantity, description]
      );

      await connection.commit();
      return { success: true, newStock };

    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  // Reabastecer stock (compra)
  async restock(req, res) {
    let connection;
    try {
      const { variantId, quantity, description } = req.body;

      if (!variantId || !quantity || quantity <= 0) {
        return res.status(400).json({ error: "Datos inválidos" });
      }

      const result = await this.updateStock(
        variantId, 
        quantity, 
        'add', 
        req.user.login, 
        description || 'Reabastecimiento manual'
      );

      res.json({
        success: true,
        message: "Stock actualizado exitosamente",
        data: result
      });

    } catch (error) {
      res.status(500).json({ error: "Error restocking inventory", details: error.message });
    }
  }

  // =============================================
  // MÉTODOS CRUD BASE 
  // =============================================

  async addInventory(req, res) {
    let connection;
    try {
      const { variant, stock, min_stock, max_stock, is_active } = req.body;

      if (!variant || stock === undefined || !min_stock || !max_stock || is_active === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (stock < 0) {
        return res.status(400).json({ error: "El stock no puede ser negativo" });
      }

      if (min_stock < 0) {
        return res.status(400).json({ error: "El stock mínimo no puede ser negativo" });
      }

      if (max_stock <= min_stock) {
        return res.status(400).json({ error: "El stock máximo debe ser mayor al mínimo" });
      }

      // VALIDACIÓN: Variante existe
      const variantExists = await this.validateVariantExists(variant);
      if (!variantExists) {
        return res.status(400).json({ error: "La variante no existe" });
      }

      // Verificar si ya existe inventario para esta variante
      const [existing] = await connect.query(
        'SELECT inventory_id FROM inventory WHERE variant_FK = ?',
        [variant]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: "Ya existe inventario para esta variante" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO inventory 
         (variant_FK, stock, min_stock, max_stock, is_active, created_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [variant, stock, min_stock, max_stock, is_active, req.user?.login || 'system']
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        data: [{ id: result.insertId, variant, stock, min_stock, max_stock, is_active }],
        message: "Inventario creado exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error adding Inventory", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async updateInventory(req, res) {
    let connection;
    try {
      const { variant, stock, min_stock, max_stock, is_active } = req.body;
      const inventoryId = req.params.id;

      if (!variant || stock === undefined || !min_stock || !max_stock || is_active === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (stock < 0) {
        return res.status(400).json({ error: "El stock no puede ser negativo" });
      }

      if (min_stock < 0) {
        return res.status(400).json({ error: "El stock mínimo no puede ser negativo" });
      }

      if (max_stock <= min_stock) {
        return res.status(400).json({ error: "El stock máximo debe ser mayor al mínimo" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");

      const [result] = await connection.query(
        `UPDATE inventory 
         SET variant_FK=?, stock=?, min_stock=?, max_stock=?, is_active=?, updatedAt=?, last_modified_by=?
         WHERE inventory_id=?`,
        [variant, stock, min_stock, max_stock, is_active, update_at, req.user?.login || 'system', inventoryId]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Inventory not found" });
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        data: [{ variant, stock, min_stock, max_stock, is_active, update_at }],
        message: "Inventario actualizado exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error updating Inventory", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async deleteInventory(req, res) {
    let connection;
    try {
      const inventoryId = req.params.id;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Verificar si tiene movimientos
      const [movements] = await connection.query(
        'SELECT inventoryMovement_id FROM inventorymovement WHERE variant_FK = (SELECT variant_FK FROM inventory WHERE inventory_id = ?) LIMIT 1',
        [inventoryId]
      );

      if (movements.length > 0) {
        // Soft delete: solo desactivar
        await connection.query(
          'UPDATE inventory SET is_active = 0 WHERE inventory_id = ?',
          [inventoryId]
        );

        await connection.commit();

        return res.status(200).json({
          success: true,
          message: "Inventario desactivado (tenía movimientos asociados)",
          softDelete: true
        });
      }

      // Si no tiene movimientos, eliminar físicamente
      const [result] = await connection.query('DELETE FROM inventory WHERE inventory_id = ?', [inventoryId]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Inventory not found" });
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Inventario eliminado exitosamente",
        deleted: result.affectedRows
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error deleting Inventory", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async showInventory(res) {
    try {
      const [result] = await connect.query(`
        SELECT i.*, p.product_name, v.size
        FROM inventory i
        JOIN productvariants v ON i.variant_FK = v.variant_id
        JOIN products p ON v.product_FK = p.product_id
      `);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching Inventory", details: error.message });
    }
  }

  async showInventoryById(res, req) {
    try {
      const [result] = await connect.query(
        `SELECT i.*, p.product_name, v.size
         FROM inventory i
         JOIN productvariants v ON i.variant_FK = v.variant_id
         JOIN products p ON v.product_FK = p.product_id
         WHERE i.inventory_id = ?`,
        [req.params.id]
      );

      if (result.length === 0) return res.status(404).json({ error: "Inventory not found" });

      res.status(200).json({
        success: true,
        data: result[0]
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching Inventory", details: error.message });
    }
  }
}

export default InventoryModel;