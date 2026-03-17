import { connect } from '../config/db/connect.js';

class PurchaseOrderModel {
  constructor(id, status, totalAmount, paymentMethod, supplier, user) {
    this.id = id;
    this.status = status;
    this.totalAmount = totalAmount;
    this.paymentMethod = paymentMethod;
    this.supplier = supplier;
    this.user = user;
  }

  // VALIDACIÓN: Proveedor existe y está activo
  async validateSupplierActive(supplierId) {
    const [result] = await connect.query(
      'SELECT supplier_id, supplier_status FROM supplier WHERE supplier_id = ?',
      [supplierId]
    );
    
    if (result.length === 0) {
      return { exists: false };
    }
    
    return {
      exists: true,
      isActive: result[0].supplier_status === 'Activo',
      supplier: result[0]
    };
  }

  // VALIDACIÓN: Usuario existe
  async validateUserExists(userId) {
    const [result] = await connect.query(
      'SELECT user_id FROM user WHERE user_id = ?',
      [userId]
    );
    return result.length > 0;
  }

  // Crear orden de compra con detalles
  async createPurchaseOrder(req, res) {
    let connection;
    try {
      const { supplierId, paymentMethod, items } = req.body;
      const userId = req.user.user_id;

      if (!supplierId || !paymentMethod || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Datos inválidos" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // 1. Validar proveedor activo
      const supplierCheck = await this.validateSupplierActive(supplierId);
      if (!supplierCheck.exists) {
        await connection.rollback();
        return res.status(400).json({ error: "El proveedor no existe" });
      }
      if (!supplierCheck.isActive) {
        await connection.rollback();
        return res.status(400).json({ error: "El proveedor está inactivo" });
      }

      // 2. Calcular total y validar items
      let totalAmount = 0;
      for (const item of items) {
        if (!item.variantId || !item.quantity || !item.unitPrice) {
          await connection.rollback();
          return res.status(400).json({ error: "Cada item debe tener variantId, quantity y unitPrice" });
        }

        if (item.quantity <= 0 || item.unitPrice <= 0) {
          await connection.rollback();
          return res.status(400).json({ error: "Cantidad y precio deben ser mayores a 0" });
        }

        // Validar que la variante existe
        const [variant] = await connection.query(
          'SELECT variant_id FROM productvariants WHERE variant_id = ?',
          [item.variantId]
        );

        if (variant.length === 0) {
          await connection.rollback();
          return res.status(400).json({ error: `La variante ${item.variantId} no existe` });
        }

        totalAmount += item.quantity * item.unitPrice;
      }

      // 3. Crear la orden de compra
      const [orderResult] = await connection.query(
        `INSERT INTO purchaseorder 
         (purchaseOrder_status, purchaseOrder_totalAmount, purchaseOrder_paymentMethod, supplier_FK, user_FK, created_by) 
         VALUES ('Pendiente', ?, ?, ?, ?, ?)`,
        [totalAmount, paymentMethod, supplierId, userId, req.user.login]
      );

      const orderId = orderResult.insertId;

      // 4. Crear detalles y actualizar inventario (cuando se reciba)
      for (const item of items) {
        const subtotal = item.quantity * item.unitPrice;
        
        await connection.query(
          `INSERT INTO purchasedetail 
           (purchaseDetail_quantity, purchaseDetail_unitPrice, purchaseDetail_subTotal, purchaseOrder_FK, variant_FK) 
           VALUES (?, ?, ?, ?, ?)`,
          [item.quantity, item.unitPrice, subtotal, orderId, item.variantId]
        );
      }

      await connection.commit();

      res.status(201).json({
        success: true,
        message: "Orden de compra creada exitosamente",
        data: {
          order_id: orderId,
          total_amount: totalAmount,
          status: 'Pendiente',
          item_count: items.length
        }
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error creating purchase order", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  // Recibir orden de compra (actualizar inventario)
  async receivePurchaseOrder(req, res) {
    let connection;
    try {
      const orderId = req.params.id;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // 1. Validar que la orden existe y está pendiente
      const [order] = await connection.query(
        'SELECT purchaseOrder_status FROM purchaseorder WHERE purchaseOrder_id = ?',
        [orderId]
      );

      if (order.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Orden de compra no encontrada" });
      }

      if (order[0].purchaseOrder_status !== 'Pendiente') {
        await connection.rollback();
        return res.status(400).json({ 
          error: "Solo se pueden recibir órdenes pendientes",
          current_status: order[0].purchaseOrder_status
        });
      }

      // 2. Obtener detalles
      const [details] = await connection.query(
        'SELECT * FROM purchasedetail WHERE purchaseOrder_FK = ?',
        [orderId]
      );

      if (details.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: "La orden no tiene detalles" });
      }

      // 3. Actualizar inventario para cada variante
      for (const detail of details) {
        // Verificar si existe inventario para esta variante
        const [inventory] = await connection.query(
          'SELECT inventory_id FROM inventory WHERE variant_FK = ?',
          [detail.variant_FK]
        );

        if (inventory.length === 0) {
          // Crear registro de inventario si no existe
          await connection.query(
            `INSERT INTO inventory 
             (variant_FK, stock, min_stock, max_stock, is_active, created_by) 
             VALUES (?, ?, 5, 100, 1, ?)`,
            [detail.variant_FK, detail.purchaseDetail_quantity, req.user.login]
          );
        } else {
          // Actualizar stock existente
          await connection.query(
            'UPDATE inventory SET stock = stock + ?, last_modified_by = ?, updatedAt = NOW() WHERE variant_FK = ?',
            [detail.purchaseDetail_quantity, req.user.login, detail.variant_FK]
          );
        }

        // Registrar movimiento de inventario
        await connection.query(
          `INSERT INTO inventorymovement 
           (variant_FK, purchase_FK, user_FK, movement_type, quantity, movement_description) 
           VALUES (?, ?, ?, 'Entrada', ?, ?)`,
          [detail.variant_FK, orderId, req.user.user_id, detail.purchaseDetail_quantity, 
           `Compra a proveedor - Orden #${orderId}`]
        );
      }

      // 4. Actualizar estado de la orden
      await connection.query(
        'UPDATE purchaseorder SET purchaseOrder_status = "Recibida", last_modified_by = ?, updatedAt = NOW() WHERE purchaseOrder_id = ?',
        [req.user.login, orderId]
      );

      await connection.commit();

      res.json({
        success: true,
        message: "Orden de compra recibida exitosamente",
        data: {
          order_id: orderId,
          items_processed: details.length
        }
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error receiving purchase order", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  // Cancelar orden de compra
  async cancelPurchaseOrder(req, res) {
    let connection;
    try {
      const orderId = req.params.id;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      const [order] = await connection.query(
        'SELECT purchaseOrder_status FROM purchaseorder WHERE purchaseOrder_id = ?',
        [orderId]
      );

      if (order.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Orden de compra no encontrada" });
      }

      if (order[0].purchaseOrder_status !== 'Pendiente') {
        await connection.rollback();
        return res.status(400).json({ 
          error: "Solo se pueden cancelar órdenes pendientes",
          current_status: order[0].purchaseOrder_status
        });
      }

      await connection.query(
        'UPDATE purchaseorder SET purchaseOrder_status = "Cancelada", last_modified_by = ?, updatedAt = NOW() WHERE purchaseOrder_id = ?',
        [req.user.login, orderId]
      );

      await connection.commit();

      res.json({
        success: true,
        message: "Orden de compra cancelada exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error cancelling purchase order", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  // =============================================
  // MÉTODOS CRUD BASE 
  // =============================================

  async addPurchaseOrder(req, res) {
    let connection;
    try {
      const { status, totalAmount, paymentMethod, supplier, user } = req.body;

      if (!status || !totalAmount || !paymentMethod || !supplier || !user) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // VALIDACIÓN: Proveedor existe
      const supplierCheck = await this.validateSupplierActive(supplier);
      if (!supplierCheck.exists) {
        return res.status(400).json({ error: "El proveedor no existe" });
      }

      // VALIDACIÓN: Usuario existe
      const userExists = await this.validateUserExists(user);
      if (!userExists) {
        return res.status(400).json({ error: "El usuario no existe" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO purchaseorder 
         (purchaseOrder_status, purchaseOrder_totalAmount, purchaseOrder_paymentMethod, supplier_FK, user_FK, created_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [status, totalAmount, paymentMethod, supplier, user, req.user?.login || 'system']
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        data: [{ id: result.insertId, status, totalAmount, paymentMethod, supplier, user }],
        message: "Orden de compra creada exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error adding PurchaseOrder", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async updatePurchaseOrder(req, res) {
    let connection;
    try {
      const { status, totalAmount, paymentMethod, supplier, user } = req.body;
      const orderId = req.params.id;

      if (!status || !totalAmount || !paymentMethod || !supplier || !user) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");

      const [result] = await connection.query(
        `UPDATE purchaseorder 
         SET purchaseOrder_status=?, purchaseOrder_totalAmount=?, purchaseOrder_paymentMethod=?, supplier_FK=?, user_FK=?, updatedAt=?, last_modified_by=?
         WHERE purchaseOrder_id=?`,
        [status, totalAmount, paymentMethod, supplier, user, update_at, req.user?.login || 'system', orderId]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "PurchaseOrder not found" });
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        data: [{ status, totalAmount, paymentMethod, supplier, user, update_at }],
        message: "Orden de compra actualizada exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error updating PurchaseOrder", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async deletePurchaseOrder(req, res) {
    let connection;
    try {
      const orderId = req.params.id;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Verificar si tiene detalles
      const [details] = await connection.query(
        'SELECT purchaseDetail_id FROM purchasedetail WHERE purchaseOrder_FK = ? LIMIT 1',
        [orderId]
      );

      if (details.length > 0) {
        // Soft delete: solo cambiar estado
        await connection.query(
          'UPDATE purchaseorder SET purchaseOrder_status = "Eliminado" WHERE purchaseOrder_id = ?',
          [orderId]
        );

        await connection.commit();

        return res.status(200).json({
          success: true,
          message: "Orden de compra desactivada (tenía detalles asociados)",
          softDelete: true
        });
      }

      // Si no tiene detalles, eliminar físicamente
      const [result] = await connection.query('DELETE FROM purchaseorder WHERE purchaseOrder_id = ?', [orderId]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "PurchaseOrder not found" });
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Orden de compra eliminada exitosamente",
        deleted: result.affectedRows
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error deleting PurchaseOrder", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async showPurchaseOrder(res) {
    try {
      const [result] = await connect.query(`
        SELECT po.*, 
               s.supplier_name,
               u.login as user_login,
               COUNT(pd.purchaseDetail_id) as item_count
        FROM purchaseorder po
        JOIN supplier s ON po.supplier_FK = s.supplier_id
        LEFT JOIN user u ON po.user_FK = u.user_id
        LEFT JOIN purchasedetail pd ON po.purchaseOrder_id = pd.purchaseOrder_FK
        GROUP BY po.purchaseOrder_id
        ORDER BY po.created_at DESC
      `);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching PurchaseOrders", details: error.message });
    }
  }

  async showPurchaseOrderById(res, req) {
    try {
      const [result] = await connect.query(
        `SELECT po.*,
                JSON_ARRAYAGG(
                  JSON_OBJECT(
                    'detail_id', pd.purchaseDetail_id,
                    'variant_id', pd.variant_FK,
                    'quantity', pd.purchaseDetail_quantity,
                    'unit_price', pd.purchaseDetail_unitPrice,
                    'subtotal', pd.purchaseDetail_subTotal,
                    'product_name', p.product_name,
                    'size', v.size
                  )
                ) as details
         FROM purchaseorder po
         JOIN supplier s ON po.supplier_FK = s.supplier_id
         LEFT JOIN purchasedetail pd ON po.purchaseOrder_id = pd.purchaseOrder_FK
         LEFT JOIN productvariants v ON pd.variant_FK = v.variant_id
         LEFT JOIN products p ON v.product_FK = p.product_id
         WHERE po.purchaseOrder_id = ?
         GROUP BY po.purchaseOrder_id`,
        [req.params.id]
      );

      if (result.length === 0) return res.status(404).json({ error: "PurchaseOrder not found" });

      res.status(200).json({
        success: true,
        data: result[0]
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching PurchaseOrder", details: error.message });
    }
  }
}

export default PurchaseOrderModel;