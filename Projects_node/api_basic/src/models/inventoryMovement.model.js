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
        sqlQuery += " AND DATE(im.createdAt) >= ?";
        params.push(startDate);
      }

      if (endDate) {
        sqlQuery += " AND DATE(im.createdAt) <= ?";
        params.push(endDate);
      }

      sqlQuery += " ORDER BY im.createdAt DESC LIMIT ?";
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
        ORDER BY im.createdAt DESC
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