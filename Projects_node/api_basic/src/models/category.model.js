import { connect } from '../config/db/connect.js';

class CategoryModel {
  constructor(id, name, description) {
    this.id = id;
    this.name = name;
    this.description = description;
  }

  // VALIDACIÓN: Nombre único
  async validateUniqueName(name, excludeId = null) {
    let sqlQuery = "SELECT category_id FROM category WHERE category_name = ?";
    const params = [name];
    
    if (excludeId) {
      sqlQuery += " AND category_id != ?";
      params.push(excludeId);
    }
    
    const [result] = await connect.query(sqlQuery, params);
    return result.length === 0;
  }

  // VALIDACIÓN: Tiene productos activos asociados
  async hasActiveProducts(categoryId) {
    const [result] = await connect.query(
      'SELECT product_id FROM products WHERE category_FK = ? AND status = "Activo" LIMIT 1',
      [categoryId]
    );
    return result.length > 0;
  }

  async addCategory(req, res) {
    let connection;
    try {
      const { name, description } = req.body;
      
      // Validar campos requeridos
      if (!name || !description) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
      }

      // VALIDACIÓN: Nombre único
      const isNameUnique = await this.validateUniqueName(name);
      if (!isNameUnique) {
        return res.status(400).json({ error: "Ya existe una categoría con este nombre" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      let sqlQuery = "INSERT INTO category (category_name, category_description) VALUES (?, ?)";
      const [result] = await connection.query(sqlQuery, [name, description]);

      await connection.commit();

      res.status(201).json({
        success: true,
        data: [{ 
          id: result.insertId, 
          name, 
          description 
        }],
        message: "Categoría creada exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error adding Category", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async updateCategory(req, res) {
    let connection;
    try {
      const { name, description } = req.body;
      const categoryId = req.params.id;

      // Validar campos requeridos
      if (!name || !description) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
      }

      // VALIDACIÓN: Nombre único (excluyendo esta categoría)
      const isNameUnique = await this.validateUniqueName(name, categoryId);
      if (!isNameUnique) {
        return res.status(400).json({ error: "Ya existe una categoría con este nombre" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      let sqlQuery = "UPDATE category SET category_name=?, category_description=? WHERE category_id=?";
      const [result] = await connection.query(sqlQuery, [name, description, categoryId]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Category not found" });
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        data: [{ name, description }],
        message: "Categoría actualizada exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error updating Category", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async deleteCategory(req, res) {
    let connection;
    try {
      const categoryId = req.params.id;

      // VALIDACIÓN: No tener productos activos
      const hasActive = await this.hasActiveProducts(categoryId);
      if (hasActive) {
        return res.status(400).json({ 
          error: "No se puede eliminar la categoría porque tiene productos activos asociados" 
        });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      let sqlQuery = "DELETE FROM category WHERE category_id = ?";
      const [result] = await connection.query(sqlQuery, [categoryId]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Category not found" });
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Categoría eliminada exitosamente",
        deleted: result.affectedRows
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error deleting Category", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async showCategory(res) {
    try {
      // Incluir conteo de productos por categoría
      let sqlQuery = `
        SELECT c.*, COUNT(p.product_id) as product_count
        FROM category c
        LEFT JOIN products p ON c.category_id = p.category_FK
        GROUP BY c.category_id
      `;
      const [result] = await connect.query(sqlQuery);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching Categories", details: error.message });
    }
  }

  async showCategoryById(res, req) {
    try {
      const [result] = await connect.query(
        `SELECT c.*, COUNT(p.product_id) as product_count
         FROM category c
         LEFT JOIN products p ON c.category_id = p.category_FK
         WHERE c.category_id = ?
         GROUP BY c.category_id`,
        [req.params.id]
      );
      
      if (result.length === 0) return res.status(404).json({ error: "Category not found" });
      
      res.status(200).json({
        success: true,
        data: result[0]
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching Category", details: error.message });
    }
  }

  // Obtener categorías con productos activos (para clientes)
  async getActiveCategories(req, res) {
    try {
      const [result] = await connect.query(`
        SELECT DISTINCT c.*
        FROM category c
        INNER JOIN products p ON c.category_id = p.category_FK
        WHERE p.status = 'Activo'
      `);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching active categories", details: error.message });
    }
  }

  //  Obtener productos por categoría
  async getProductsByCategory(req, res) {
    try {
      const { id } = req.params;
      const { onlyActive } = req.query;

      let sqlQuery = `
        SELECT p.*, 
               COUNT(v.variant_id) as variant_count,
               MIN(v.unit_price) as min_price,
               MAX(v.unit_price) as max_price
        FROM products p
        LEFT JOIN productvariants v ON p.product_id = v.product_FK
        WHERE p.category_FK = ?
      `;
      
      if (onlyActive === 'true') {
        sqlQuery += " AND p.status = 'Activo'";
      }
      
      sqlQuery += " GROUP BY p.product_id";
      
      const [result] = await connect.query(sqlQuery, [id]);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching products by category", details: error.message });
    }
  }
}

export default CategoryModel;