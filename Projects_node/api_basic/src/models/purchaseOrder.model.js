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

  async updatePurchaseOrder(req, res) {
    let connection;
    try {
      const orderId = req.params.id;
      const { supplierId, paymentMethod } = req.body; // solo estos campos

      if (!supplierId && !paymentMethod) {
        return res.status(400).json({ error: "Debe proporcionar al menos supplierId o paymentMethod" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Verificar que la orden existe y está pendiente
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
          error: "Solo se pueden modificar órdenes en estado Pendiente",
          current_status: order[0].purchaseOrder_status
        });
      }

      // Validar proveedor si se envía
      if (supplierId) {
        const supplierCheck = await this.validateSupplierActive(supplierId);
        if (!supplierCheck.exists) {
          await connection.rollback();
          return res.status(400).json({ error: "El proveedor no existe" });
        }
        if (!supplierCheck.isActive) {
          await connection.rollback();
          return res.status(400).json({ error: "El proveedor está inactivo" });
        }
      }

      // Construir consulta de actualización dinámica
      const updates = [];
      const params = [];
      if (supplierId) {
        updates.push("supplier_FK = ?");
        params.push(supplierId);
      }
      if (paymentMethod) {
        updates.push("purchaseOrder_paymentMethod = ?");
        params.push(paymentMethod);
      }

      if (updates.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: "No hay campos válidos para actualizar" });
      }

      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota", hour12: false }).replace(",", "").replace("/", "-").replace("/", "-");
      params.push(update_at, req.user?.login || 'system', orderId);

      const sql = `UPDATE purchaseorder SET ${updates.join(", ")}, updatedAt = ?, last_modified_by = ? WHERE purchaseOrder_id = ?`;
      const [result] = await connection.query(sql, params);

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Orden de compra actualizada exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error updating PurchaseOrder", details: error.message });
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
        ORDER BY po.createdAt DESC
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
      const orderId = req.params.id;

      // 1. Obtener información de la orden de compra
      const [purchaseOrder] = await connect.query(
        `SELECT po.*, s.supplier_name
        FROM purchaseorder po
        JOIN supplier s ON po.supplier_FK = s.supplier_id
        WHERE po.purchaseOrder_id = ?`,
        [orderId]
      );

      if (purchaseOrder.length === 0) {
        return res.status(404).json({ error: "PurchaseOrder not found" });
      }

      // 2. Obtener los detalles de la orden
      const [details] = await connect.query(
        `SELECT 
          pd.purchaseDetail_id as detail_id,
          pd.variant_FK as variant_id,
          pd.purchaseDetail_quantity as quantity,
          pd.purchaseDetail_unitPrice as unit_price,
          pd.purchaseDetail_subTotal as subtotal,
          p.product_name,
          v.size
        FROM purchasedetail pd
        LEFT JOIN productvariants v ON pd.variant_FK = v.variant_id
        LEFT JOIN products p ON v.product_FK = p.product_id
        WHERE pd.purchaseOrder_FK = ?`,
        [orderId]
      );

      // 3. Construir la respuesta
      res.status(200).json({
        success: true,
        data: {
          ...purchaseOrder[0],
          details: details || []
        }
      });

    } catch (error) {
      console.error('Error en showPurchaseOrderById:', error);
      res.status(500).json({ error: "Error fetching PurchaseOrder", details: error.message });
    }
  }
}

export default PurchaseOrderModel;