import { connect } from '../config/db/connect.js';

class ProductPromotionModel {
  constructor(id, variant, promotion) {
    this.id = id;
    this.variant = variant;
    this.promotion = promotion;
  }

  // VALIDACIÓN: Variante existe
  async validateVariantExists(variantId) {
    const [result] = await connect.query(
      'SELECT variant_id FROM productvariants WHERE variant_id = ?',
      [variantId]
    );
    return result.length > 0;
  }

  // VALIDACIÓN: Promoción existe y está activa
  async validatePromotionActive(promotionId) {
    const [result] = await connect.query(
      `SELECT promotion_id, promotion_discount, start_date, end_date 
       FROM promotion 
       WHERE promotion_id = ?`,
      [promotionId]
    );
    
    if (result.length === 0) {
      return { exists: false };
    }

    const now = new Date();
    const start = new Date(result[0].start_date);
    const end = new Date(result[0].end_date);
    const isActive = now >= start && now <= end;

    return {
      exists: true,
      isActive,
      discount: result[0].promotion_discount,
      promotion: result[0]
    };
  }

  // VALIDACIÓN: No duplicar asignación
  async validateUniqueAssignment(variantId, promotionId, excludeId = null) {
    let sqlQuery = "SELECT productPromotion_id FROM productpromotion WHERE variant_FK = ? AND promotion_FK = ?";
    const params = [variantId, promotionId];
    
    if (excludeId) {
      sqlQuery += " AND productPromotion_id != ?";
      params.push(excludeId);
    }
    
    const [result] = await connect.query(sqlQuery, params);
    return result.length === 0;
  }

  // Obtener promociones aplicables a una variante (para catálogo)
  async getVariantPromotions(variantId) {
    try {
      const now = new Date().toISOString().split('T')[0];

      const [result] = await connect.query(
        `SELECT p.* 
         FROM promotion p
         INNER JOIN productpromotion pp ON p.promotion_id = pp.promotion_FK
         WHERE pp.variant_FK = ? 
           AND p.start_date <= ? 
           AND p.end_date >= ?
         ORDER BY p.promotion_discount DESC`,
        [variantId, now, now]
      );

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Calcular precio con descuento
  calculateDiscountedPrice(originalPrice, discount) {
    return originalPrice * (1 - discount / 100);
  }

  // Asignar promoción a múltiples variantes
  async bulkAssign(req, res) {
    let connection;
    try {
      const { promotionId, variantIds } = req.body;

      if (!promotionId || !variantIds || !Array.isArray(variantIds) || variantIds.length === 0) {
        return res.status(400).json({ error: "Datos inválidos" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Validar que la promoción existe
      const promotionCheck = await this.validatePromotionActive(promotionId);
      if (!promotionCheck.exists) {
        await connection.rollback();
        return res.status(400).json({ error: "La promoción no existe" });
      }

      const results = [];
      const errors = [];

      for (const variantId of variantIds) {
        // Validar variante
        const variantExists = await this.validateVariantExists(variantId);
        if (!variantExists) {
          errors.push({ variantId, error: "La variante no existe" });
          continue;
        }

        // Validar asignación única
        const isUnique = await this.validateUniqueAssignment(variantId, promotionId);
        if (!isUnique) {
          errors.push({ variantId, error: "La variante ya tiene esta promoción asignada" });
          continue;
        }

        // Insertar
        const [result] = await connection.query(
          `INSERT INTO productpromotion (variant_FK, promotion_FK, created_by) 
           VALUES (?, ?, ?)`,
          [variantId, promotionId, req.user?.login || 'system']
        );

        results.push({
          productPromotion_id: result.insertId,
          variantId,
          promotionId
        });
      }

      await connection.commit();

      res.status(201).json({
        success: true,
        message: `Asignación completada: ${results.length} exitosas, ${errors.length} fallidas`,
        data: {
          successful: results,
          failed: errors
        }
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error in bulk assign", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  // =============================================
  // MÉTODOS CRUD BASE 
  // =============================================

  async addProductPromotion(req, res) {
    let connection;
    try {
      const { variant, promotion } = req.body;

      if (!variant || !promotion) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // VALIDACIÓN: Variante existe
      const variantExists = await this.validateVariantExists(variant);
      if (!variantExists) {
        return res.status(400).json({ error: "La variante no existe" });
      }

      // VALIDACIÓN: Promoción existe
      const promotionCheck = await this.validatePromotionActive(promotion);
      if (!promotionCheck.exists) {
        return res.status(400).json({ error: "La promoción no existe" });
      }

      // VALIDACIÓN: Asignación única
      const isUnique = await this.validateUniqueAssignment(variant, promotion);
      if (!isUnique) {
        return res.status(400).json({ error: "Esta variante ya tiene esta promoción asignada" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO productpromotion (variant_FK, promotion_FK, created_by) 
         VALUES (?, ?, ?)`,
        [variant, promotion, req.user?.login || 'system']
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        data: [{ id: result.insertId, variant, promotion }],
        message: "Promoción asignada exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error adding ProductPromotion", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async updateProductPromotion(req, res) {
    let connection;
    try {
      const { variant, promotion } = req.body;
      const assignmentId = req.params.id;

      if (!variant || !promotion) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota", hour12: false }).replace(",", "").replace("/", "-").replace("/", "-");

      const [result] = await connection.query(
        `UPDATE productpromotion 
         SET variant_FK=?, promotion_FK=?, updatedAt=?, last_modified_by=?
         WHERE productPromotion_id=?`,
        [variant, promotion, update_at, req.user?.login || 'system', assignmentId]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "ProductPromotion not found" });
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        data: [{ variant, promotion, update_at }],
        message: "Asignación actualizada exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error updating ProductPromotion", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async deleteProductPromotion(req, res) {
    let connection;
    try {
      const assignmentId = req.params.id;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      const [result] = await connection.query('DELETE FROM productpromotion WHERE productPromotion_id = ?', [assignmentId]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "ProductPromotion not found" });
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Asignación eliminada exitosamente",
        deleted: result.affectedRows
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error deleting ProductPromotion", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async showProductPromotion(res) {
    try {
      const now = new Date().toISOString().split('T')[0];

      const [result] = await connect.query(`
        SELECT pp.*, 
               p.promotion_title, p.promotion_discount, 
               p.start_date, p.end_date,
               pr.product_name, v.size, v.unit_price,
               CASE 
                 WHEN p.start_date <= ? AND p.end_date >= ? THEN 'Activa'
                 ELSE 'Inactiva'
               END as promotion_status,
               ROUND(v.unit_price * (1 - p.promotion_discount/100), 2) as discounted_price
        FROM productpromotion pp
        JOIN promotion p ON pp.promotion_FK = p.promotion_id
        JOIN productvariants v ON pp.variant_FK = v.variant_id
        JOIN products pr ON v.product_FK = pr.product_id
        ORDER BY p.promotion_discount DESC
      `, [now, now]);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching ProductPromotions", details: error.message });
    }
  }

  async showProductPromotionById(res, req) {
    try {
      const [result] = await connect.query(
        `SELECT pp.*, 
                p.promotion_title, p.promotion_discount, 
                p.start_date, p.end_date,
                pr.product_name, v.size, v.unit_price,
                ROUND(v.unit_price * (1 - p.promotion_discount/100), 2) as discounted_price
         FROM productpromotion pp
         JOIN promotion p ON pp.promotion_FK = p.promotion_id
         JOIN productvariants v ON pp.variant_FK = v.variant_id
         JOIN products pr ON v.product_FK = pr.product_id
         WHERE pp.productPromotion_id = ?`,
        [req.params.id]
      );

      if (result.length === 0) return res.status(404).json({ error: "ProductPromotion not found" });

      res.status(200).json({
        success: true,
        data: result[0]
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching ProductPromotion", details: error.message });
    }
  }
}

export default ProductPromotionModel;