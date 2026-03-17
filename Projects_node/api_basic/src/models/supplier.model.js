import { connect } from '../config/db/connect.js';

class SupplierModel {
  constructor(id, name, address, phone, email, status) {
    this.id = id;
    this.name = name;
    this.address = address;
    this.phone = phone;
    this.email = email;
    this.status = status;
  }

  // VALIDACIÓN: Email único
  async validateUniqueEmail(email, excludeId = null) {
    let sqlQuery = "SELECT supplier_id FROM supplier WHERE supplier_email = ?";
    const params = [email];
    
    if (excludeId) {
      sqlQuery += " AND supplier_id != ?";
      params.push(excludeId);
    }
    
    const [result] = await connect.query(sqlQuery, params);
    return result.length === 0;
  }

  // VALIDACIÓN: Proveedor tiene órdenes de compra
  async hasPurchaseOrders(supplierId) {
    const [result] = await connect.query(
      'SELECT purchaseOrder_id FROM purchaseorder WHERE supplier_FK = ? LIMIT 1',
      [supplierId]
    );
    return result.length > 0;
  }

  // Obtener proveedores con estadísticas
  async getSuppliersWithStats(req, res) {
    try {
      const [result] = await connect.query(`
        SELECT s.*, 
               COUNT(po.purchaseOrder_id) as total_orders,
               COALESCE(SUM(po.purchaseOrder_totalAmount), 0) as total_purchases,
               MAX(po.created_at) as last_purchase
        FROM supplier s
        LEFT JOIN purchaseorder po ON s.supplier_id = po.supplier_FK
        GROUP BY s.supplier_id
        ORDER BY s.supplier_name
      `);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      res.status(500).json({ error: "Error fetching suppliers with stats", details: error.message });
    }
  }

  // =============================================
  // MÉTODOS CRUD BASE 
  // =============================================

  async addSupplier(req, res) {
    let connection;
    try {
      const { name, address, phone, email, status } = req.body;

      if (!name || !address || !phone || !email || !status) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // VALIDACIÓN: Email único
      const isEmailUnique = await this.validateUniqueEmail(email);
      if (!isEmailUnique) {
        return res.status(400).json({ error: "El email del proveedor ya está registrado" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO supplier 
         (supplier_name, supplier_address, supplier_phone, supplier_email, supplier_status, created_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, address, phone, email, status, req.user?.login || 'system']
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        data: [{ id: result.insertId, name, address, phone, email, status }],
        message: "Proveedor creado exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error adding Supplier", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async updateSupplier(req, res) {
    let connection;
    try {
      const { name, address, phone, email, status } = req.body;
      const supplierId = req.params.id;

      if (!name || !address || !phone || !email || !status) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // VALIDACIÓN: Email único (excluyendo este proveedor)
      const isEmailUnique = await this.validateUniqueEmail(email, supplierId);
      if (!isEmailUnique) {
        return res.status(400).json({ error: "El email del proveedor ya está registrado" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");

      const [result] = await connection.query(
        `UPDATE supplier 
         SET supplier_name=?, supplier_address=?, supplier_phone=?, supplier_email=?, supplier_status=?, updatedAt=?, last_modified_by=?
         WHERE supplier_id=?`,
        [name, address, phone, email, status, update_at, req.user?.login || 'system', supplierId]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Supplier not found" });
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        data: [{ name, address, phone, email, status, update_at }],
        message: "Proveedor actualizado exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error updating Supplier", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async deleteSupplier(req, res) {
    let connection;
    try {
      const supplierId = req.params.id;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // VALIDACIÓN: Tiene órdenes de compra?
      const hasOrders = await this.hasPurchaseOrders(supplierId);
      if (hasOrders) {
        // Soft delete: solo cambiar estado
        await connection.query(
          'UPDATE supplier SET supplier_status = "Inactivo", last_modified_by = ?, updatedAt = NOW() WHERE supplier_id = ?',
          [req.user?.login || 'system', supplierId]
        );

        await connection.commit();

        return res.status(200).json({
          success: true,
          message: "Proveedor desactivado (tiene órdenes de compra asociadas)",
          softDelete: true
        });
      }

      // Si no tiene órdenes, eliminar físicamente
      const [result] = await connection.query('DELETE FROM supplier WHERE supplier_id = ?', [supplierId]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Supplier not found" });
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Proveedor eliminado exitosamente",
        deleted: result.affectedRows
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error deleting Supplier", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async showSupplier(res) {
    try {
      const [result] = await connect.query(`
        SELECT s.*, 
               COUNT(po.purchaseOrder_id) as total_orders
        FROM supplier s
        LEFT JOIN purchaseorder po ON s.supplier_id = po.supplier_FK
        GROUP BY s.supplier_id
        ORDER BY s.supplier_name
      `);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching Suppliers", details: error.message });
    }
  }

  async showSupplierById(res, req) {
    try {
      const [result] = await connect.query(
        `SELECT s.*,
                JSON_ARRAYAGG(
                  JSON_OBJECT(
                    'order_id', po.purchaseOrder_id,
                    'status', po.purchaseOrder_status,
                    'total', po.purchaseOrder_totalAmount,
                    'date', po.created_at
                  )
                ) as purchase_orders
         FROM supplier s
         LEFT JOIN purchaseorder po ON s.supplier_id = po.supplier_FK
         WHERE s.supplier_id = ?
         GROUP BY s.supplier_id`,
        [req.params.id]
      );

      if (result.length === 0) return res.status(404).json({ error: "Supplier not found" });

      res.status(200).json({
        success: true,
        data: result[0]
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching Supplier", details: error.message });
    }
  }
}

export default SupplierModel;