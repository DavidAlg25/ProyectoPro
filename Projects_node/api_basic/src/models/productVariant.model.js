import { connect } from '../config/db/connect.js';

class ProductVariantModel {
  constructor(id, product, size, unitPrice, variant_status) {
    this.id = id;
    this.product = product;
    this.size = size;
    this.unitPrice = unitPrice;
    this.variant_status = variant_status;
  }

  // VALIDACIÓN: Talla única por producto
  async validateUniqueSize(productId, size, excludeId = null) {
    let sqlQuery = "SELECT variant_id FROM productvariants WHERE product_FK = ? AND size = ?";
    const params = [productId, size];
    
    if (excludeId) {
      sqlQuery += " AND variant_id != ?";
      params.push(excludeId);
    }
    
    const [result] = await connect.query(sqlQuery, params);
    return result.length === 0;
  }

  // VALIDACIÓN: Producto existe y está activo
  async validateProductActive(productId) {
    const [result] = await connect.query(
      'SELECT product_id, status FROM products WHERE product_id = ?',
      [productId]
    );
    
    if (result.length === 0) {
      return { exists: false, active: false };
    }
    
    return { 
      exists: true, 
      active: result[0].status === 'Activo',
      product: result[0]
    };
  }

  // VALIDACIÓN: Precio válido
  validatePrice(price) {
    return price > 0;
  }

  // VALIDACIÓN: Verificar stock disponible
  async checkStock(variantId, requestedQuantity) {
    const [result] = await connect.query(
      `SELECT i.stock 
       FROM inventory i 
       WHERE i.variant_FK = ?`,
      [variantId]
    );
    
    const currentStock = result.length > 0 ? result[0].stock : 0;
    return currentStock >= requestedQuantity;
  }

  async addProductVariant(req, res) {
    let connection;
    try {
      const { product, size, unitPrice, variant_status } = req.body;
      
      // Validar campos requeridos
      if (!product || !size || !unitPrice) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
      }

      // VALIDACIÓN 1: Producto existe y está activo
      const productCheck = await this.validateProductActive(product);
      if (!productCheck.exists) {
        return res.status(400).json({ error: "El producto especificado no existe" });
      }
      if (!productCheck.active) {
        return res.status(400).json({ error: "No se pueden crear variantes para un producto inactivo" });
      }

      // VALIDACIÓN 2: Talla única por producto
      const isSizeUnique = await this.validateUniqueSize(product, size);
      if (!isSizeUnique) {
        return res.status(400).json({ error: "Ya existe una variante con esta talla para el producto" });
      }

      // VALIDACIÓN 3: Precio mayor a 0
      if (!this.validatePrice(unitPrice)) {
        return res.status(400).json({ error: "El precio debe ser mayor a 0" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Estado por defecto: 'Activo' si no se especifica
      const status = variant_status || 'Activo';

      let sqlQuery = `INSERT INTO productvariants 
                      (product_FK, size, unit_price, status) 
                      VALUES (?, ?, ?, ?)`;

      const [result] = await connection.query(sqlQuery, [
        product, size, unitPrice, status
      ]);

      // Crear entrada en inventario para esta variante
      await connection.query(
        `INSERT INTO inventory (variant_FK, stock, min_stock, max_stock, is_active) 
         VALUES (?, 0, 5, 100, ?)`,
        [result.insertId, status === 'Activo' ? 1 : 0]
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        data: [{ 
          id: result.insertId, 
          product, 
          size, 
          unitPrice, 
          status 
        }],
        message: "Variante creada exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error adding Product Variant", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async updateProductVariant(req, res) {
    let connection;
    try {
      const { product, size, unitPrice, variant_status } = req.body;
      const variantId = req.params.id;

      // Validar campos requeridos
      if (!product || !size || !unitPrice) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
      }

      // VALIDACIÓN 1: Producto existe y está activo (si cambió de producto)
      const productCheck = await this.validateProductActive(product);
      if (!productCheck.exists) {
        return res.status(400).json({ error: "El producto especificado no existe" });
      }

      // VALIDACIÓN 2: Talla única por producto (excluyendo esta variante)
      const isSizeUnique = await this.validateUniqueSize(product, size, variantId);
      if (!isSizeUnique) {
        return res.status(400).json({ error: "Ya existe una variante con esta talla para el producto" });
      }

      // VALIDACIÓN 3: Precio mayor a 0
      if (!this.validatePrice(unitPrice)) {
        return res.status(400).json({ error: "El precio debe ser mayor a 0" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      const updated_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");

      let sqlQuery = `UPDATE productvariants 
                      SET product_FK=?, size=?, unit_price=?, status=?, updatedAt=? 
                      WHERE variant_id=?`;

      const [result] = await connection.query(sqlQuery, [
        product, size, unitPrice, variant_status, updated_at, variantId
      ]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Variant not found" });
      }

      // Actualizar estado en inventario
      await connection.query(
        'UPDATE inventory SET is_active = ? WHERE variant_FK = ?',
        [variant_status === 'Activo' ? 1 : 0, variantId]
      );

      await connection.commit();

      res.status(200).json({
        success: true,
        data: [{ product, size, unitPrice, variant_status, updated_at }],
        message: "Variante actualizada exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error updating Product Variant", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async deleteProductVariant(req, res) {
    let connection;
    try {
      const variantId = req.params.id;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Verificar si tiene movimientos de inventario
      const [movements] = await connection.query(
        'SELECT inventoryMovement_id FROM inventorymovement WHERE variant_FK = ? LIMIT 1',
        [variantId]
      );

      if (movements.length > 0) {
        // Soft delete: solo marcar como inactivo
        await connection.query(
          'UPDATE productvariants SET status = "Inactivo" WHERE variant_id = ?',
          [variantId]
        );
        
        await connection.query(
          'UPDATE inventory SET is_active = 0 WHERE variant_FK = ?',
          [variantId]
        );

        await connection.commit();

        return res.status(200).json({
          success: true,
          message: "Variante desactivada (tiene movimientos asociados)",
          softDelete: true
        });
      }

      // Si no tiene movimientos, eliminar físicamente
      await connection.query(
        'DELETE FROM inventory WHERE variant_FK = ?',
        [variantId]
      );

      let sqlQuery = "DELETE FROM productvariants WHERE variant_id = ?";
      const [result] = await connection.query(sqlQuery, [variantId]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Variant not found" });
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Variante eliminada exitosamente",
        deleted: result.affectedRows
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error deleting Product Variant", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async showProductVariant(res) {
    try {
      let sqlQuery = `
        SELECT v.*, p.product_name, p.product_code,
               i.stock, i.min_stock, i.max_stock
        FROM productvariants v
        JOIN products p ON v.product_FK = p.product_id
        LEFT JOIN inventory i ON v.variant_id = i.variant_FK
      `;
      const [result] = await connect.query(sqlQuery);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching Product Variants", details: error.message });
    }
  }

  async showProductVariantById(res, req) {
    try {
      const [result] = await connect.query(
        `SELECT v.*, p.product_name, p.product_code,
                i.stock, i.min_stock, i.max_stock
         FROM productvariants v
         JOIN products p ON v.product_FK = p.product_id
         LEFT JOIN inventory i ON v.variant_id = i.variant_FK
         WHERE v.variant_id = ?`,
        [req.params.id]
      );
      
      if (result.length === 0) return res.status(404).json({ error: "Variant not found" });
      
      res.status(200).json({
        success: true,
        data: result[0]
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching Product Variant", details: error.message });
    }
  }

  // Obtener variantes por producto
  async getVariantsByProduct(req, res) {
    try {
      const { productId } = req.params;
      const { onlyActive } = req.query;

      let sqlQuery = `
        SELECT v.*, i.stock
        FROM productvariants v
        LEFT JOIN inventory i ON v.variant_id = i.variant_FK
        WHERE v.product_FK = ?
      `;
      
      if (onlyActive === 'true') {
        sqlQuery += " AND v.status = 'Activo'";
      }
      
      const [result] = await connect.query(sqlQuery, [productId]);
      
      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      res.status(500).json({ error: "Error fetching variants by product", details: error.message });
    }
  }

  // Verificar disponibilidad de stock
  async checkAvailability(req, res) {
    try {
      const { id } = req.params;
      const { quantity } = req.query;

      const hasStock = await this.checkStock(id, quantity || 1);
      
      const [variant] = await connect.query(
        `SELECT v.*, i.stock 
         FROM productvariants v
         JOIN inventory i ON v.variant_id = i.variant_FK
         WHERE v.variant_id = ?`,
        [id]
      );

      res.status(200).json({
        success: true,
        data: {
          variant_id: id,
          available: hasStock,
          currentStock: variant[0]?.stock || 0,
          requestedQuantity: parseInt(quantity) || 1
        }
      });

    } catch (error) {
      res.status(500).json({ error: "Error checking availability", details: error.message });
    }
  }
}

export default ProductVariantModel;