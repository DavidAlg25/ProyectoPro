import { connect } from '../config/db/connect.js';

class OrderModel {
  constructor(id, customer, order_status, totalAmount) {
    this.id = id;
    this.customer = customer;
    this.order_status = order_status;
    this.totalAmount = totalAmount;
  }

  // VALIDACIÓN: Cliente existe
  async validateCustomerExists(customerId) {
    const [result] = await connect.query(
      'SELECT customer_id FROM customer WHERE customer_id = ?',
      [customerId]
    );
    return result.length > 0;
  }

  // VALIDACIÓN: La orden pertenece al usuario
  async validateOrderOwnership(orderId, userId) {
    const [result] = await connect.query(
      `SELECT o.order_id 
       FROM \`order\` o
       JOIN customer c ON o.customer_FK = c.customer_id
       WHERE o.order_id = ? AND c.user_FK = ?`,
      [orderId, userId]
    );
    return result.length > 0;
  }

  // Crear orden desde carrito (checkout)
  async createOrderFromCart(req, res) {
    let connection;
    try {
      const userId = req.user.user_id;
      const { cartId } = req.body;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // 1. Obtener customer_id del usuario
      const [customer] = await connection.query(
        'SELECT customer_id FROM customer WHERE user_FK = ?',
        [userId]
      );

      if (customer.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Cliente no encontrado" });
      }

      const customerId = customer[0].customer_id;

      // 2. Validar que el carrito pertenece al cliente
      const [cart] = await connection.query(
        'SELECT shoppingCart_id FROM shoppingcart WHERE shoppingCart_id = ? AND customer_FK = ? AND shoppingCart_status = "Activo"',
        [cartId, customerId]
      );

      if (cart.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: "Carrito no válido o no pertenece al cliente" });
      }

      // 3. Obtener items del carrito con validación de stock
      const [cartItems] = await connection.query(
        `SELECT ci.variant_FK, ci.cartItem_quantity, ci.cartItem_unitPrice,
                i.stock, v.unit_price as current_price
         FROM cartitem ci
         JOIN inventory i ON ci.variant_FK = i.variant_FK
         JOIN productvariants v ON ci.variant_FK = v.variant_id
         WHERE ci.shoppingCart_FK = ?`,
        [cartId]
      );

      if (cartItems.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: "El carrito está vacío" });
      }

      // 4. Validar stock y calcular total
      let totalAmount = 0;
      for (const item of cartItems) {
        if (item.stock < item.cartItem_quantity) {
          await connection.rollback();
          return res.status(400).json({ 
            error: "Stock insuficiente",
            variant_id: item.variant_FK,
            available: item.stock,
            requested: item.cartItem_quantity
          });
        }

        // Usar el precio actual de la variante
        const itemTotal = item.cartItem_quantity * item.current_price;
        totalAmount += itemTotal;
      }

      // 5. Crear la orden
      const [orderResult] = await connection.query(
        `INSERT INTO \`order\` 
         (customer_FK, order_status, order_total_amount, created_by) 
         VALUES (?, 'Pendiente', ?, ?)`,
        [customerId, totalAmount, req.user.login]
      );

      const orderId = orderResult.insertId;

      // 6. Crear detalles de la orden y actualizar inventario
      for (const item of cartItems) {
        // Insertar detalle con el precio actual
        await connection.query(
          `INSERT INTO orderdetail 
           (order_id, variant_FK, order_detail_quantity, order_detail_unit_price) 
           VALUES (?, ?, ?, ?)`,
          [orderId, item.variant_FK, item.cartItem_quantity, item.current_price]
        );

        // Actualizar inventario (restar stock)
        await connection.query(
          `UPDATE inventory 
           SET stock = stock - ?,
               last_modified_by = ?,
               updatedAt = NOW()
           WHERE variant_FK = ?`,
          [item.cartItem_quantity, req.user.login, item.variant_FK]
        );

        // Registrar movimiento de inventario
        await connection.query(
          `INSERT INTO inventorymovement 
           (variant_FK, user_FK, movement_type, quantity, movement_description) 
           VALUES (?, ?, 'Salida', ?, ?)`,
          [item.variant_FK, req.user.login, item.cartItem_quantity, 
           `Venta - Orden #${orderId}`]
        );
      }

      // 7. Marcar carrito como procesado
      await connection.query(
        'UPDATE shoppingcart SET shoppingCart_status = "Procesado" WHERE shoppingCart_id = ?',
        [cartId]
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        message: "Orden creada exitosamente",
        data: {
          order_id: orderId,
          total_amount: totalAmount,
          status: 'Pendiente',
          item_count: cartItems.length
        }
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error creating order", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  // Obtener órdenes del cliente autenticado
  async getMyOrders(req, res) {
    try {
      const userId = req.user.user_id;

      const [orders] = await connect.query(
        `SELECT o.*,
                (SELECT COUNT(*) FROM orderdetail WHERE order_id = o.order_id) as item_count,
                (SELECT SUM(order_detail_quantity * order_detail_unit_price) 
                 FROM orderdetail WHERE order_id = o.order_id) as calculated_total,
                (SELECT payment_status FROM payment WHERE order_FK = o.order_id LIMIT 1) as payment_status
         FROM \`order\` o
         JOIN customer c ON o.customer_FK = c.customer_id
         WHERE c.user_FK = ?
         ORDER BY o.created_at DESC`,
        [userId]
      );

      res.json({
        success: true,
        data: orders
      });

    } catch (error) {
      res.status(500).json({ error: "Error fetching orders", details: error.message });
    }
  }

  // Obtener detalle completo de una orden específica
  async getOrderDetails(req, res) {
    try {
      const userId = req.user.user_id;
      const orderId = req.params.id;

      // Verificar propiedad
      const isOwner = await this.validateOrderOwnership(orderId, userId);
      if (!isOwner && !req.user.roles.some(r => r.role_name === 'admin')) {
        return res.status(403).json({ error: "No tienes permiso para ver esta orden" });
      }

      const [order] = await connect.query(
        `SELECT o.*,
                JSON_ARRAYAGG(
                  JSON_OBJECT(
                    'detail_id', od.order_detail_id,
                    'variant_id', od.variant_FK,
                    'quantity', od.order_detail_quantity,
                    'unit_price', od.order_detail_unit_price,
                    'subtotal', od.order_detail_quantity * od.order_detail_unit_price,
                    'product_name', p.product_name,
                    'size', v.size,
                    'image_url', p.image_url
                  )
                ) as details,
                JSON_ARRAYAGG(
                  JSON_OBJECT(
                    'payment_id', pm.payment_id,
                    'amount', pm.payment_amount,
                    'method', pm.payment_method,
                    'reference', pm.payment_reference,
                    'status', pm.payment_status,
                    'date', pm.created_at
                  )
                ) as payments
         FROM \`order\` o
         LEFT JOIN orderdetail od ON o.order_id = od.order_id
         LEFT JOIN productvariants v ON od.variant_FK = v.variant_id
         LEFT JOIN products p ON v.product_FK = p.product_id
         LEFT JOIN payment pm ON o.order_id = pm.order_FK
         WHERE o.order_id = ?
         GROUP BY o.order_id`,
        [orderId]
      );

      if (order.length === 0) {
        return res.status(404).json({ error: "Orden no encontrada" });
      }

      res.json({
        success: true,
        data: order[0]
      });

    } catch (error) {
      res.status(500).json({ error: "Error fetching order details", details: error.message });
    }
  }

  // Cancelar orden (solo si está pendiente)
  async cancelOrder(req, res) {
    let connection;
    try {
      const userId = req.user.user_id;
      const orderId = req.params.id;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Verificar propiedad y estado
      const [order] = await connection.query(
        `SELECT o.order_id, o.order_status 
         FROM \`order\` o
         JOIN customer c ON o.customer_FK = c.customer_id
         WHERE o.order_id = ? AND c.user_FK = ?`,
        [orderId, userId]
      );

      if (order.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Orden no encontrada" });
      }

      if (order[0].order_status !== 'Pendiente') {
        await connection.rollback();
        return res.status(400).json({ 
          error: "Solo se pueden cancelar órdenes pendientes",
          current_status: order[0].order_status
        });
      }

      // Verificar si ya tiene pagos
      const [payments] = await connection.query(
        'SELECT payment_id FROM payment WHERE order_FK = ? LIMIT 1',
        [orderId]
      );

      if (payments.length > 0) {
        await connection.rollback();
        return res.status(400).json({ 
          error: "No se puede cancelar una orden con pagos registrados" 
        });
      }

      // Restaurar stock
      const [details] = await connection.query(
        'SELECT variant_FK, order_detail_quantity FROM orderdetail WHERE order_id = ?',
        [orderId]
      );

      for (const detail of details) {
        await connection.query(
          'UPDATE inventory SET stock = stock + ? WHERE variant_FK = ?',
          [detail.order_detail_quantity, detail.variant_FK]
        );

        await connection.query(
          `INSERT INTO inventorymovement 
           (variant_FK, user_FK, movement_type, quantity, movement_description) 
           VALUES (?, ?, 'Entrada', ?, ?)`,
          [detail.variant_FK, req.user.login, detail.order_detail_quantity,
           `Cancelación orden #${orderId}`]
        );
      }

      // Actualizar estado de la orden
      await connection.query(
        'UPDATE `order` SET order_status = "Cancelada", last_modified_by = ?, updatedAt = NOW() WHERE order_id = ?',
        [req.user.login, orderId]
      );

      await connection.commit();

      res.json({
        success: true,
        message: "Orden cancelada exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error cancelling order", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  // =============================================
  // MÉTODOS CRUD BASE 
  // =============================================

  async addOrder(req, res) {
    let connection;
    try {
      const { customer, order_status, totalAmount } = req.body;

      if (!customer || !order_status || !totalAmount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // VALIDACIÓN: Cliente existe
      const customerExists = await this.validateCustomerExists(customer);
      if (!customerExists) {
        return res.status(400).json({ error: "El cliente no existe" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO \`order\` 
         (customer_FK, order_status, order_total_amount, created_by) 
         VALUES (?, ?, ?, ?)`,
        [customer, order_status, totalAmount, req.user?.login || 'system']
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        data: [{ id: result.insertId, customer, order_status, totalAmount }],
        message: "Orden creada exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error adding Order", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async updateOrder(req, res) {
    let connection;
    try {
      const { customer, order_status, totalAmount } = req.body;
      const orderId = req.params.id;

      if (!customer || !order_status || !totalAmount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");

      const [result] = await connection.query(
        `UPDATE \`order\` 
         SET customer_FK=?, order_status=?, order_total_amount=?, updatedAt=?, last_modified_by=?
         WHERE order_id=?`,
        [customer, order_status, totalAmount, update_at, req.user?.login || 'system', orderId]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Order not found" });
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        data: [{ customer, order_status, totalAmount, update_at }],
        message: "Orden actualizada exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error updating Order", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async deleteOrder(req, res) {
    let connection;
    try {
      const orderId = req.params.id;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Verificar si tiene detalles
      const [details] = await connection.query(
        'SELECT order_detail_id FROM orderdetail WHERE order_id = ? LIMIT 1',
        [orderId]
      );

      if (details.length > 0) {
        // Soft delete: solo cambiar estado
        await connection.query(
          'UPDATE `order` SET order_status = "Eliminado" WHERE order_id = ?',
          [orderId]
        );

        await connection.commit();

        return res.status(200).json({
          success: true,
          message: "Orden desactivada (tenía detalles asociados)",
          softDelete: true
        });
      }

      // Si no tiene detalles, eliminar físicamente
      const [result] = await connection.query('DELETE FROM `order` WHERE order_id = ?', [orderId]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Order not found" });
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Orden eliminada exitosamente",
        deleted: result.affectedRows
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error deleting Order", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async showOrder(res) {
    try {
      const [result] = await connect.query(`
        SELECT o.*, 
               COUNT(od.order_detail_id) as item_count,
               c.first_name, c.first_last_name,
               (SELECT payment_status FROM payment WHERE order_FK = o.order_id LIMIT 1) as payment_status
        FROM \`order\` o
        LEFT JOIN orderdetail od ON o.order_id = od.order_id
        LEFT JOIN customer c ON o.customer_FK = c.customer_id
        GROUP BY o.order_id
        ORDER BY o.created_at DESC
      `);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching Orders", details: error.message });
    }
  }

  async showOrderById(res, req) {
    try {
      const [result] = await connect.query(
        `SELECT o.*,
                JSON_ARRAYAGG(
                  JSON_OBJECT(
                    'detail_id', od.order_detail_id,
                    'variant_id', od.variant_FK,
                    'quantity', od.order_detail_quantity,
                    'unit_price', od.order_detail_unit_price,
                    'subtotal', od.order_detail_quantity * od.order_detail_unit_price
                  )
                ) as details
         FROM \`order\` o
         LEFT JOIN orderdetail od ON o.order_id = od.order_id
         WHERE o.order_id = ?
         GROUP BY o.order_id`,
        [req.params.id]
      );

      if (result.length === 0) return res.status(404).json({ error: "Order not found" });

      res.status(200).json({
        success: true,
        data: result[0]
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching Order", details: error.message });
    }
  }
}

export default OrderModel;