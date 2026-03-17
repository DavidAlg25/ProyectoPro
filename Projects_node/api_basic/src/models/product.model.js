import { connect } from '../config/db/connect.js';

class ProductModel {
  constructor(id, code, name, description, category, product_status, image_url) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.description = description;
    this.category = category;
    this.product_status = product_status;
    this.image_url = image_url;
  }

  // VALIDACIÓN: Código único
  async validateUniqueCode(code, excludeId = null) {
    let sqlQuery = "SELECT product_id FROM products WHERE product_code = ?";
    const params = [code];
    
    if (excludeId) {
      sqlQuery += " AND product_id != ?";
      params.push(excludeId);
    }
    
    const [result] = await connect.query(sqlQuery, params);
    return result.length === 0;
  }

  // VALIDACIÓN: Categoría existe
  async validateCategoryExists(categoryId) {
    const [result] = await connect.query(
      'SELECT category_id FROM category WHERE category_id = ?',
      [categoryId]
    );
    return result.length > 0;
  }

  // VALIDACIÓN: Tiene variantes activas (para eliminar)
  async hasActiveVariants(productId) {
    const [result] = await connect.query(
      'SELECT variant_id FROM productvariants WHERE product_FK = ? AND status = "Activo"',
      [productId]
    );
    return result.length > 0;
  }

  async addProduct(req, res) {
    let connection;
    try {
      const { code, name, description, category, product_status, image_url } = req.body;
      
      // Validar campos requeridos
      if (!code || !name || !description || !category || !image_url) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
      }

      // VALIDACIÓN 1: Código único
      const isCodeUnique = await this.validateUniqueCode(code);
      if (!isCodeUnique) {
        return res.status(400).json({ error: "El código de producto ya existe" });
      }

      // VALIDACIÓN 2: Categoría existe
      const categoryExists = await this.validateCategoryExists(category);
      if (!categoryExists) {
        return res.status(400).json({ error: "La categoría especificada no existe" });
      }

      // Usar transacción para asegurar consistencia
      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Obtener usuario que crea (del token)
      const createdBy = req.user?.login || 'system';

      let sqlQuery = `INSERT INTO products 
                      (product_code, product_name, product_description, category_FK, status, image_url, created_by) 
                      VALUES (?, ?, ?, ?, ?, ?, ?)`;
      
      // Estado por defecto: 'Activo' si no se especifica
      const status = product_status || 'Activo';
      
      const [result] = await connection.query(sqlQuery, [
        code, name, description, category, status, image_url, createdBy
      ]);

      await connection.commit();

      res.status(201).json({
        success: true,
        data: [{ 
          id: result.insertId, 
          code, 
          name, 
          description, 
          category, 
          status,
          image_url 
        }],
        message: "Producto creado exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error adding Product", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async updateProduct(req, res) {
    let connection;
    try {
      const { code, name, description, category, product_status, image_url } = req.body;
      const productId = req.params.id;

      // Validar campos requeridos
      if (!code || !name || !description || !category || !image_url) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
      }

      // VALIDACIÓN 1: Código único (excluyendo este producto)
      const isCodeUnique = await this.validateUniqueCode(code, productId);
      if (!isCodeUnique) {
        return res.status(400).json({ error: "El código de producto ya existe" });
      }

      // VALIDACIÓN 2: Categoría existe
      const categoryExists = await this.validateCategoryExists(category);
      if (!categoryExists) {
        return res.status(400).json({ error: "La categoría especificada no existe" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      const updated_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");
      const lastModifiedBy = req.user?.login || 'system';

      let sqlQuery = `UPDATE products 
                      SET product_code=?, product_name=?, product_description=?, 
                          category_FK=?, status=?, image_url=?, 
                          updatedAt=?, last_modified_by=? 
                      WHERE product_id=?`;

      const [result] = await connection.query(sqlQuery, [
        code, name, description, category, product_status, image_url, 
        updated_at, lastModifiedBy, productId
      ]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Product not found" });
      }

      // Si el producto se inactiva, inactivar todas sus variantes
      if (product_status === 'Inactivo') {
        await connection.query(
          'UPDATE productvariants SET status = "Inactivo" WHERE product_FK = ?',
          [productId]
        );
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        data: [{ code, name, description, category, product_status, image_url, updated_at }],
        message: "Producto actualizado exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error updating Product", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async deleteProduct(req, res) {
    let connection;
    try {
      const productId = req.params.id;

      // VALIDACIÓN: No tener variantes activas
      const hasActive = await this.hasActiveVariants(productId);
      if (hasActive) {
        return res.status(400).json({ 
          error: "No se puede eliminar el producto porque tiene variantes activas" 
        });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      let sqlQuery = "DELETE FROM products WHERE product_id = ?";
      const [result] = await connection.query(sqlQuery, [productId]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Product not found" });
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Producto eliminado exitosamente",
        deleted: result.affectedRows
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error deleting Product", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  // Obtener productos con sus variantes (para catálogo)
  async getProductsWithVariants(req, res) {
    try {
      const { category, onlyActive } = req.query;
      
      let sqlQuery = `
        SELECT 
          p.*,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'variant_id', v.variant_id,
              'size', v.size,
              'unit_price', v.unit_price,
              'status', v.status
            )
          ) as variants
        FROM products p
        LEFT JOIN productvariants v ON p.product_id = v.product_FK
        WHERE 1=1
      `;
      
      const params = [];
      
      if (category) {
        sqlQuery += " AND p.category_FK = ?";
        params.push(category);
      }
      
      if (onlyActive === 'true') {
        sqlQuery += " AND p.status = 'Activo' AND (v.status = 'Activo' OR v.status IS NULL)";
      }
      
      sqlQuery += " GROUP BY p.product_id";
      
      const [result] = await connect.query(sqlQuery, params);
      
      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      res.status(500).json({ error: "Error fetching Products with variants", details: error.message });
    }
  }

  // Cambiar estado del producto (activa/inactiva)
  async toggleStatus(req, res) {
    let connection;
    try {
      const { id } = req.params;
      const { status } = req.body; // 'Activo' o 'Inactivo'

      if (!status || !['Activo', 'Inactivo'].includes(status)) {
        return res.status(400).json({ error: "Estado inválido" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Actualizar producto
      await connection.query(
        'UPDATE products SET status = ?, last_modified_by = ?, updatedAt = NOW() WHERE product_id = ?',
        [status, req.user?.login || 'system', id]
      );

      // Si se inactiva, inactivar todas las variantes
      if (status === 'Inactivo') {
        await connection.query(
          'UPDATE productvariants SET status = "Inactivo" WHERE product_FK = ?',
          [id]
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: `Producto ${status === 'Activo' ? 'activado' : 'inactivado'} exitosamente`
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error changing product status", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }
}

export default ProductModel;