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
           SET stock = stock - ?
           WHERE variant_FK = ?`,
          [item.cartItem_quantity, item.variant_FK]
        );

        // Registrar movimiento de inventario
        await connection.query(
          `INSERT INTO inventorymovement 
           (variant_FK, user_FK, movement_type, quantity, movement_description) 
           VALUES (?, ?, 'Salida', ?, ?)`,
          [item.variant_FK, req.user.user_id, item.cartItem_quantity, 
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
              (SELECT COALESCE(SUM(order_detail_quantity * order_detail_unit_price), 0)
               FROM orderdetail WHERE order_id = o.order_id) as calculated_total,
              (SELECT COALESCE(payment_status, 'No pagado') 
               FROM payment WHERE order_FK = o.order_id LIMIT 1) as order_payment_status
       FROM \`order\` o
       JOIN customer c ON o.customer_FK = c.customer_id
       WHERE c.user_FK = ?
       ORDER BY o.createdAt DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Error en getMyOrders:', error);
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

      // 1. Obtener información de la orden
      const [order] = await connect.query(
        `SELECT o.* 
        FROM \`order\` o
        WHERE o.order_id = ?`,
        [orderId]
      );

      if (order.length === 0) {
        return res.status(404).json({ error: "Orden no encontrada" });
      }

      // 2. Obtener los detalles de la orden
      const [details] = await connect.query(
        `SELECT 
          od.order_detail_id as detail_id,
          od.variant_FK as variant_id,
          od.order_detail_quantity as quantity,
          od.order_detail_unit_price as unit_price,
          (od.order_detail_quantity * od.order_detail_unit_price) as subtotal,
          p.product_name,
          v.size,
          p.image_url
        FROM orderdetail od
        LEFT JOIN productvariants v ON od.variant_FK = v.variant_id
        LEFT JOIN products p ON v.product_FK = p.product_id
        WHERE od.order_id = ?`,
        [orderId]
      );

      // 3. Obtener los pagos asociados a la orden
      const [payments] = await connect.query(
        `SELECT 
          payment_id,
          payment_amount as amount,
          payment_method as method,
          payment_reference as reference,
          payment_status as status,
          createdAt as date
        FROM payment
        WHERE order_FK = ?`,
        [orderId]
      );

      // 4. Construir la respuesta
      res.json({
        success: true,
        data: {
          ...order[0],
          details: details || [],
          payments: payments || []
        }
      });

    } catch (error) {
      console.error('Error en getOrderDetails:', error);
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
          [detail.variant_FK, req.user.user_id, detail.order_detail_quantity,
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

  async createOrderManual(req, res) {
    let connection;
    try {
      const { 
        customerId, 
        order_status, 
        payment_method, 
        payment_amount, 
        payment_reference,
        items 
      } = req.body;

      // Validaciones básicas
      if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Datos inválidos: se requiere customerId y al menos un item" });
      }

      // Validar que customer existe
      const customerExists = await this.validateCustomerExists(customerId);
      if (!customerExists) {
        return res.status(400).json({ error: "Cliente no existe" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Calcular total y validar stock
      let totalAmount = 0;
      for (const item of items) {
        const { variantId, quantity, unitPrice } = item;
        if (!variantId || !quantity || quantity <= 0 || !unitPrice || unitPrice <= 0) {
          await connection.rollback();
          return res.status(400).json({ error: "Item inválido" });
        }

        // Verificar stock
        const [stock] = await connection.query(
          'SELECT stock FROM inventory WHERE variant_FK = ?',
          [variantId]
        );
        if (stock.length === 0 || stock[0].stock < quantity) {
          await connection.rollback();
          return res.status(400).json({ error: `Stock insuficiente para variante ${variantId}` });
        }

        totalAmount += quantity * unitPrice;
      }

      // Crear orden
      const [orderResult] = await connection.query(
        `INSERT INTO \`order\` 
        (customer_FK, order_status, order_total_amount, created_by) 
        VALUES (?, ?, ?, ?)`,
        [customerId, order_status || 'Pendiente', totalAmount, req.user.login]
      );
      const orderId = orderResult.insertId;

      // Crear detalles de orden y descontar stock
      for (const item of items) {
        const { variantId, quantity, unitPrice } = item;

        // Insertar detalle
        await connection.query(
          `INSERT INTO orderdetail 
          (order_id, variant_FK, order_detail_quantity, order_detail_unit_price) 
          VALUES (?, ?, ?, ?)`,
          [orderId, variantId, quantity, unitPrice]
        );

        // Descontar stock
        await connection.query(
          `UPDATE inventory 
          SET stock = stock - ?, last_modified_by = ?, updatedAt = NOW()
          WHERE variant_FK = ?`,
          [quantity, req.user.login, variantId]
        );

        // Registrar movimiento de inventario (Salida)
        await connection.query(
          `INSERT INTO inventorymovement 
          (variant_FK, user_FK, movement_type, quantity, movement_description) 
          VALUES (?, ?, 'Salida', ?, ?)`,
          [variantId, req.user.user_id, quantity, `Venta manual - Orden #${orderId}`]
        );
      }

      // Si se incluye pago y el monto coincide con el total, registrarlo y actualizar estado
      if (payment_method && payment_amount && payment_amount === totalAmount) {
        await connection.query(
          `INSERT INTO payment 
          (payment_amount, payment_method, payment_reference, order_FK, payment_status, created_by) 
          VALUES (?, ?, ?, ?, 'Completado', ?)`,
          [payment_amount, payment_method, payment_reference || null, orderId, req.user.login]
        );

        // Actualizar estado de la orden a Pagado si no lo estaba
        if (order_status !== 'Pagado') {
          await connection.query(
            `UPDATE \`order\` SET order_status = 'Pagado' WHERE order_id = ?`,
            [orderId]
          );
        }
      }

      await connection.commit();

      res.status(201).json({
        success: true,
        message: "Orden creada exitosamente",
        data: { order_id: orderId, total_amount: totalAmount, status: order_status || 'Pendiente' }
      });

    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error createOrderManual:', error);
      res.status(500).json({ error: "Error creating order", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async updateOrder(req, res) {
    let connection;
    try {
      const { order_status } = req.body; // solo permitimos cambiar estado
      const orderId = req.params.id;

      if (!order_status) {
        return res.status(400).json({ error: "Se requiere order_status" });
      }

      // Estados permitidos
      const validStatus = ['Pendiente', 'Pagado', 'Cancelada'];
      if (!validStatus.includes(order_status)) {
        return res.status(400).json({ error: "Estado inválido" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Obtener orden actual y verificar si tiene factura
      const [order] = await connection.query(
        `SELECT o.order_status, i.invoice_id 
        FROM \`order\` o
        LEFT JOIN invoice i ON o.order_id = i.order_FK
        WHERE o.order_id = ?`,
        [orderId]
      );
      if (order.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Orden no encontrada" });
      }

      const currentStatus = order[0].order_status;
      const hasInvoice = order[0].invoice_id !== null;

      // Reglas de negocio
      if (hasInvoice && order_status !== 'Cancelada') {
        await connection.rollback();
        return res.status(400).json({ error: "Orden ya facturada, solo se puede cancelar" });
      }
      if (currentStatus === 'Cancelada' && order_status !== 'Cancelada') {
        await connection.rollback();
        return res.status(400).json({ error: "No se puede reactivar una orden cancelada" });
      }
      if (currentStatus === 'Pagado' && order_status !== 'Cancelada') {
        await connection.rollback();
        return res.status(400).json({ error: "No se puede cambiar estado de una orden pagada (excepto cancelar)" });
      }

      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota", hour12: false }).replace(",", "").replace("/", "-").replace("/", "-");

      const [result] = await connection.query(
        `UPDATE \`order\` 
        SET order_status=?, updatedAt=?, last_modified_by=?
        WHERE order_id=?`,
        [order_status, update_at, req.user?.login || 'system', orderId]
      );

      await connection.commit();

      res.status(200).json({
        success: true,
        data: [{ order_status, update_at }],
        message: "Estado de la orden actualizado exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error updating order", details: error.message });
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
        ORDER BY o.createdAt DESC
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
      const orderId = req.params.id;

      // 1. Obtener información de la orden
      const [order] = await connect.query(
        `SELECT o.* 
        FROM \`order\` o
        WHERE o.order_id = ?`,
        [orderId]
      );

      if (order.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }

      // 2. Obtener los detalles de la orden
      const [details] = await connect.query(
        `SELECT 
          od.order_detail_id as detail_id,
          od.variant_FK as variant_id,
          od.order_detail_quantity as quantity,
          od.order_detail_unit_price as unit_price,
          (od.order_detail_quantity * od.order_detail_unit_price) as subtotal
        FROM orderdetail od
        WHERE od.order_id = ?`,
        [orderId]
      );

      // 3. Construir la respuesta
      res.status(200).json({
        success: true,
        data: {
          ...order[0],
          details: details || []
        }
      });

    } catch (error) {
      console.error('Error en showOrderById:', error);
      res.status(500).json({ error: "Error fetching Order", details: error.message });
    }
  }
}

export default OrderModel;