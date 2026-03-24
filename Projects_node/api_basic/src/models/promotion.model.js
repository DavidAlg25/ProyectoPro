import { connect } from '../config/db/connect.js';

class PromotionModel {
  constructor(id, title, description, discount, start_date, end_date) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.discount = discount;
    this.start_date = start_date;
    this.end_date = end_date;
  }

  // VALIDACIÓN: Fechas correctas
  validateDates(start_date, end_date) {
    const start = new Date(start_date);
    const end = new Date(end_date);
    const now = new Date();

    if (start >= end) {
      return { valid: false, error: "La fecha de inicio debe ser anterior a la fecha de fin" };
    }

    return { valid: true };
  }

  // VALIDACIÓN: Descuento válido
  validateDiscount(discount) {
    if (discount <= 0 || discount > 100) {
      return { valid: false, error: "El descuento debe ser entre 1 y 100" };
    }
    return { valid: true };
  }

  // VALIDACIÓN: Título único
  async validateUniqueTitle(title, excludeId = null) {
    let sqlQuery = "SELECT promotion_id FROM promotion WHERE promotion_title = ?";
    const params = [title];
    
    if (excludeId) {
      sqlQuery += " AND promotion_id != ?";
      params.push(excludeId);
    }
    
    const [result] = await connect.query(sqlQuery, params);
    return result.length === 0;
  }

  // Obtener promociones activas (fecha actual dentro del rango)
  async getActivePromotions(req, res) {
    try {
      const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      const [result] = await connect.query(
        `SELECT * FROM promotion 
         WHERE start_date <= ? AND end_date >= ?
         ORDER BY promotion_discount DESC`,
        [now, now]
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      res.status(500).json({ error: "Error fetching active promotions", details: error.message });
    }
  }

  // Obtener promociones con estadísticas de uso
  async getPromotionsWithStats(req, res) {
    try {
      const [result] = await connect.query(`
        SELECT p.*, 
               COUNT(pp.productPromotion_id) as total_variants,
               (SELECT COUNT(*) FROM productpromotion pp2 
                WHERE pp2.promotion_FK = p.promotion_id 
                AND pp2.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as used_last_30_days
        FROM promotion p
        LEFT JOIN productpromotion pp ON p.promotion_id = pp.promotion_FK
        GROUP BY p.promotion_id
        ORDER BY 
          CASE 
            WHEN start_date <= CURDATE() AND end_date >= CURDATE() THEN 0
            ELSE 1
          END,
          start_date DESC
      `);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      res.status(500).json({ error: "Error fetching promotions with stats", details: error.message });
    }
  }

  // =============================================
  // MÉTODOS CRUD BASE 
  // =============================================

  async addPromotion(req, res) {
    let connection;
    try {
      const { title, description, discount, start_date, end_date } = req.body;

      if (!title || !description || !discount || !start_date || !end_date) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // VALIDACIÓN: Descuento válido
      const discountCheck = this.validateDiscount(discount);
      if (!discountCheck.valid) {
        return res.status(400).json({ error: discountCheck.error });
      }

      // VALIDACIÓN: Fechas correctas
      const datesCheck = this.validateDates(start_date, end_date);
      if (!datesCheck.valid) {
        return res.status(400).json({ error: datesCheck.error });
      }

      // VALIDACIÓN: Título único
      const isTitleUnique = await this.validateUniqueTitle(title);
      if (!isTitleUnique) {
        return res.status(400).json({ error: "Ya existe una promoción con este título" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO promotion 
         (promotion_title, promotion_description, promotion_discount, start_date, end_date, created_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [title, description, discount, start_date, end_date, req.user?.login || 'system']
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        data: [{ 
          id: result.insertId, 
          title, 
          description, 
          discount, 
          start_date, 
          end_date 
        }],
        message: "Promoción creada exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error adding Promotion", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async updatePromotion(req, res) {
    let connection;
    try {
      const { title, description, discount, start_date, end_date } = req.body;
      const promotionId = req.params.id;

      if (!title || !description || !discount || !start_date || !end_date) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // VALIDACIÓN: Descuento válido
      const discountCheck = this.validateDiscount(discount);
      if (!discountCheck.valid) {
        return res.status(400).json({ error: discountCheck.error });
      }

      // VALIDACIÓN: Fechas correctas
      const datesCheck = this.validateDates(start_date, end_date);
      if (!datesCheck.valid) {
        return res.status(400).json({ error: datesCheck.error });
      }

      // VALIDACIÓN: Título único (excluyendo esta promoción)
      const isTitleUnique = await this.validateUniqueTitle(title, promotionId);
      if (!isTitleUnique) {
        return res.status(400).json({ error: "Ya existe una promoción con este título" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota", hour12: false }).replace(",", "").replace("/", "-").replace("/", "-");

      const [result] = await connection.query(
        `UPDATE promotion 
         SET promotion_title=?, promotion_description=?, promotion_discount=?, 
             start_date=?, end_date=?, updatedAt=?, last_modified_by=?
         WHERE promotion_id=?`,
        [title, description, discount, start_date, end_date, update_at, req.user?.login || 'system', promotionId]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Promotion not found" });
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        data: [{ title, description, discount, start_date, end_date, update_at }],
        message: "Promoción actualizada exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error updating Promotion", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async deletePromotion(req, res) {
    let connection;
    try {
      const promotionId = req.params.id;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Verificar si tiene variantes asociadas
      const [variants] = await connection.query(
        'SELECT productPromotion_id FROM productpromotion WHERE promotion_FK = ? LIMIT 1',
        [promotionId]
      );

      if (variants.length > 0) {
        // Soft delete: solo marcar como inactiva? (no tenemos campo status)
        // Podríamos agregar un campo 'is_active' a la tabla promotion
        // Por ahora, devolvemos error
        await connection.rollback();
        return res.status(400).json({ 
          error: "No se puede eliminar la promoción porque tiene variantes asociadas" 
        });
      }

      const [result] = await connection.query('DELETE FROM promotion WHERE promotion_id = ?', [promotionId]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Promotion not found" });
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Promoción eliminada exitosamente",
        deleted: result.affectedRows
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error deleting Promotion", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async showPromotion(res) {
    try {
      const now = new Date().toISOString().split('T')[0];

      const [result] = await connect.query(`
        SELECT *, 
               CASE 
                 WHEN start_date <= ? AND end_date >= ? THEN 'Activa'
                 WHEN end_date < ? THEN 'Expirada'
                 WHEN start_date > ? THEN 'Programada'
               END as promotion_status
        FROM promotion
        ORDER BY 
          CASE 
            WHEN start_date <= ? AND end_date >= ? THEN 0
            WHEN start_date > ? THEN 1
            ELSE 2
          END,
          start_date
      `, [now, now, now, now, now, now, now]);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching Promotions", details: error.message });
    }
  }

  async showPromotionById(res, req) {
    try {
      const promotionId = req.params.id;

      // 1. Obtener los datos de la promoción
      const [promotion] = await connect.query(
        `SELECT p.* 
        FROM promotion p
        WHERE p.promotion_id = ?`,
        [promotionId]
      );

      if (promotion.length === 0) {
        return res.status(404).json({ error: "Promotion not found" });
      }

      // 2. Obtener las variantes asignadas a esta promoción
      const [assignedVariants] = await connect.query(
        `SELECT 
          pp.productPromotion_id,
          pp.variant_FK as variant_id,
          pr.product_name,
          v.size,
          v.unit_price,
          pp.createdAt
        FROM productpromotion pp
        LEFT JOIN productvariants v ON pp.variant_FK = v.variant_id
        LEFT JOIN products pr ON v.product_FK = pr.product_id
        WHERE pp.promotion_FK = ?`,
        [promotionId]
      );

      // 3. Construir la respuesta con el mismo formato original
      res.status(200).json({
        success: true,
        data: {
          ...promotion[0],
          assigned_variants: assignedVariants || []
        }
      });

    } catch (error) {
      console.error('Error en showPromotionById:', error);
      res.status(500).json({ error: "Error fetching Promotion", details: error.message });
    }
  }
}

export default PromotionModel;