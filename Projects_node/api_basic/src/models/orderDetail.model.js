import { connect } from '../config/db/connect.js';

class OrderDetailModel {
  constructor(id, order, variant, quantity, unitPrice) {
    this.id = id;
    this.order = order;
    this.variant = variant;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
  }

  // =============================================
  // VALIDACIONES AUXILIARES
  // =============================================

  // Verificar que la orden esté en estado Pendiente y no tenga factura
  async validateOrderCanBeModified(orderId) {
    const [order] = await connect.query(
      `SELECT order_status, 
              (SELECT invoice_id FROM invoice WHERE order_FK = ? LIMIT 1) as has_invoice
       FROM \`order\`
       WHERE order_id = ?`,
      [orderId, orderId]
    );
    if (order.length === 0) throw new Error("Orden no encontrada");
    if (order[0].order_status !== 'Pendiente')
      throw new Error("Solo se pueden modificar órdenes en estado Pendiente");
    if (order[0].has_invoice)
      throw new Error("La orden ya tiene una factura asociada, no se puede modificar");
    return true;
  }

  // Validar stock disponible
  async validateStock(variantId, quantity) {
    const [stock] = await connect.query(
      'SELECT stock FROM inventory WHERE variant_FK = ?',
      [variantId]
    );
    const currentStock = stock.length > 0 ? stock[0].stock : 0;
    if (currentStock < quantity) {
      throw new Error(`Stock insuficiente para variante ${variantId}. Disponible: ${currentStock}`);
    }
    return currentStock;
  }

  // Registrar movimiento de inventario
  async registerMovement(variantId, userId, type, quantity, description) {
    await connect.query(
      `INSERT INTO inventorymovement 
       (variant_FK, user_FK, movement_type, quantity, movement_description) 
       VALUES (?, ?, ?, ?, ?)`,
      [variantId, userId, type, quantity, description]
    );
  }

  // Ajustar stock (sumar o restar)
  async adjustStock(variantId, quantity, operation, userId) {
    const sign = operation === 'add' ? '+' : '-';
    await connect.query(
      `UPDATE inventory 
       SET stock = stock ${sign} ?, 
           last_modified_by = ?, 
           updatedAt = NOW() 
       WHERE variant_FK = ?`,
      [quantity, userId, variantId]
    );
  }

  // =============================================
  // MÉTODOS CRUD (solo para admin)
  // =============================================

  // AGREGAR DETALLE (descuenta stock)
  async addOrderDetail(req, res) {
    let connection;
    try {
      const { order, variant, quantity, unitPrice } = req.body;
      if (!order || !variant || !quantity || !unitPrice) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validar que la orden pueda modificarse
      await this.validateOrderCanBeModified(order);

      // Validar stock
      const currentStock = await this.validateStock(variant, quantity);

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Insertar detalle
      const [result] = await connection.query(
        `INSERT INTO orderdetail 
         (order_id, variant_FK, order_detail_quantity, order_detail_unit_price) 
         VALUES (?, ?, ?, ?)`,
        [order, variant, quantity, unitPrice]
      );

      // Descontar stock
      await this.adjustStock(variant, quantity, 'subtract', req.user.user_id);

      // Registrar movimiento de salida
      await this.registerMovement(
        variant, req.user.user_id, 'Salida', quantity,
        `Venta - Detalle orden #${order} (agregado manual)`
      );

      // Actualizar total de la orden
      const subtotal = quantity * unitPrice;
      await connection.query(
        'UPDATE `order` SET order_total_amount = order_total_amount + ? WHERE order_id = ?',
        [subtotal, order]
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        data: [{ id: result.insertId, order, variant, quantity, unitPrice }],
        message: "Detalle agregado exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: error.message || "Error adding OrderDetail" });
    } finally {
      if (connection) connection.release();
    }
  }

  // ACTUALIZAR DETALLE (ajusta stock y total)
  async updateOrderDetail(req, res) {
    let connection;
    try {
      const { order, variant, quantity, unitPrice } = req.body;
      const detailId = req.params.id;

      if (!order || !variant || !quantity || !unitPrice) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validar que la orden pueda modificarse
      await this.validateOrderCanBeModified(order);

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Obtener el detalle actual
      const [current] = await connection.query(
        'SELECT variant_FK, order_detail_quantity, order_detail_unit_price FROM orderdetail WHERE order_detail_id = ?',
        [detailId]
      );
      if (current.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "OrderDetail not found" });
      }

      const oldQuantity = current[0].order_detail_quantity;
      const oldUnitPrice = current[0].order_detail_unit_price;
      const oldVariant = current[0].variant_FK;

      // Calcular diferencias
      const oldSubtotal = oldQuantity * oldUnitPrice;
      const newSubtotal = quantity * unitPrice;
      const diffTotal = newSubtotal - oldSubtotal;

      // Ajustar stock: devolver lo anterior, restar lo nuevo
      if (oldVariant === variant) {
        // Misma variante, solo cambia cantidad
        if (quantity > oldQuantity) {
          const additional = quantity - oldQuantity;
          await this.validateStock(variant, additional);
          await this.adjustStock(variant, additional, 'subtract', req.user.user_id);
          await this.registerMovement(
            variant, req.user.user_id, 'Salida', additional,
            `Ajuste de cantidad en detalle #${detailId}`
          );
        } else if (quantity < oldQuantity) {
          const toReturn = oldQuantity - quantity;
          await this.adjustStock(variant, toReturn, 'add', req.user.user_id);
          await this.registerMovement(
            variant, req.user.user_id, 'Entrada', toReturn,
            `Devolución por ajuste de cantidad en detalle #${detailId}`
          );
        }
      } else {
        // Cambio de variante: devolver stock de la anterior, quitar de la nueva
        await this.adjustStock(oldVariant, oldQuantity, 'add', req.user.user_id);
        await this.registerMovement(
          oldVariant, req.user.user_id, 'Entrada', oldQuantity,
          `Devolución por cambio de variante en detalle #${detailId}`
        );
        await this.validateStock(variant, quantity);
        await this.adjustStock(variant, quantity, 'subtract', req.user.user_id);
        await this.registerMovement(
          variant, req.user.user_id, 'Salida', quantity,
          `Nueva variante en detalle #${detailId}`
        );
      }

      // Actualizar el detalle
      const [result] = await connection.query(
        `UPDATE orderdetail 
         SET order_id=?, variant_FK=?, order_detail_quantity=?, order_detail_unit_price=?
         WHERE order_detail_id=?`,
        [order, variant, quantity, unitPrice, detailId]
      );

      // Ajustar total de la orden
      if (diffTotal !== 0) {
        await connection.query(
          'UPDATE `order` SET order_total_amount = order_total_amount + ? WHERE order_id = ?',
          [diffTotal, order]
        );
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        data: [{ order, variant, quantity, unitPrice }],
        message: "Detalle actualizado exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: error.message || "Error updating OrderDetail" });
    } finally {
      if (connection) connection.release();
    }
  }

  // ELIMINAR DETALLE (devuelve stock)
  async deleteOrderDetail(req, res) {
    let connection;
    try {
      const detailId = req.params.id;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Obtener información del detalle y la orden
      const [detail] = await connection.query(
        `SELECT od.order_id, od.variant_FK, od.order_detail_quantity, od.order_detail_unit_price,
                o.order_status
         FROM orderdetail od
         JOIN \`order\` o ON od.order_id = o.order_id
         WHERE od.order_detail_id = ?`,
        [detailId]
      );
      if (detail.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "OrderDetail not found" });
      }

      const orderId = detail[0].order_id;
      const orderStatus = detail[0].order_status;
      const variant = detail[0].variant_FK;
      const quantity = detail[0].order_detail_quantity;
      const unitPrice = detail[0].order_detail_unit_price;
      const subtotal = quantity * unitPrice;

      // Validar que la orden esté en estado Pendiente y sin factura
      if (orderStatus !== 'Pendiente') {
        await connection.rollback();
        return res.status(400).json({ error: "Solo se pueden eliminar detalles de órdenes pendientes" });
      }
      const [hasInvoice] = await connection.query(
        'SELECT invoice_id FROM invoice WHERE order_FK = ? LIMIT 1',
        [orderId]
      );
      if (hasInvoice.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: "La orden ya tiene factura, no se puede eliminar el detalle" });
      }

      // Devolver stock
      await this.adjustStock(variant, quantity, 'add', req.user.user_id);
      await this.registerMovement(
        variant, req.user.user_id, 'Entrada', quantity,
        `Devolución por eliminación de detalle #${detailId}`
      );

      // Eliminar detalle
      const [result] = await connection.query('DELETE FROM orderdetail WHERE order_detail_id = ?', [detailId]);

      // Actualizar total de la orden
      await connection.query(
        'UPDATE `order` SET order_total_amount = order_total_amount - ? WHERE order_id = ?',
        [subtotal, orderId]
      );

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Detalle eliminado y stock restaurado exitosamente",
        deleted: result.affectedRows
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: error.message || "Error deleting OrderDetail" });
    } finally {
      if (connection) connection.release();
    }
  }

  // MÉTODOS DE LISTADO (sin cambios)
  async showOrderDetail(res) {
    try {
      const [result] = await connect.query(`
        SELECT od.*, p.product_name, v.size
        FROM orderdetail od
        JOIN productvariants v ON od.variant_FK = v.variant_id
        JOIN products p ON v.product_FK = p.product_id
        ORDER BY od.created_at DESC
      `);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching OrderDetails", details: error.message });
    }
  }

  async showOrderDetailById(res, req) {
    try {
      const [result] = await connect.query(
        `SELECT od.*, p.product_name, v.size
         FROM orderdetail od
         JOIN productvariants v ON od.variant_FK = v.variant_id
         JOIN products p ON v.product_FK = p.product_id
         WHERE od.order_detail_id = ?`,
        [req.params.id]
      );
      if (result.length === 0) return res.status(404).json({ error: "OrderDetail not found" });
      res.status(200).json({
        success: true,
        data: result[0]
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching OrderDetail", details: error.message });
    }
  }
}

export default OrderDetailModel;