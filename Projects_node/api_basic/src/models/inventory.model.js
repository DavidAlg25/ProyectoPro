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

  // Reabastecer stock 

  async restock(req, res) {
    let connection;
    try {
      const { variantId, quantity, description, invoiceId } = req.body;

      if (!variantId || !quantity || quantity <= 0) {
        return res.status(400).json({ error: "Datos inválidos" });
      }

      const userId = req.user.user_id;
      const userName = req.user.login;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Verificar que la variante existe
      const variantExists = await this.validateVariantExists(variantId);
      if (!variantExists) {
        await connection.rollback();
        return res.status(400).json({ error: "La variante no existe" });
      }

      // Actualizar stock
      await connection.query(
        `UPDATE inventory 
        SET stock = stock + ?,
            last_modified_by = ?,
            updatedAt = NOW()
        WHERE variant_FK = ?`,
        [quantity, userName, variantId]
      );

      // Registrar movimiento
      const finalDescription = description || `Reabastecimiento manual por ${userName}`;
      await connection.query(
        `INSERT INTO inventorymovement 
        (variant_FK, invoice_FK, user_FK, movement_type, quantity, movement_description) 
        VALUES (?, ?, ?, 'Entrada', ?, ?)`,
        [variantId, invoiceId || null, userId, quantity, finalDescription]
      );

      await connection.commit();

      res.json({
        success: true,
        message: "Stock actualizado exitosamente",
        data: { variantId, quantity, invoiceId: invoiceId || null, description: finalDescription }
      });

    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error restock:', error);
      res.status(500).json({ error: "Error actualizando stock", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  // =============================================
  // MÉTODOS CRUD BASE 
  // =============================================

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