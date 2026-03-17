import { connect } from '../config/db/connect.js';

class PaymentModel {
  constructor(id, amount, method, reference, order) {
    this.id = id;
    this.amount = amount;
    this.method = method;
    this.reference = reference;
    this.order = order;
  }

  // VALIDACIÓN: Orden existe
  async validateOrderExists(orderId) {
    const [result] = await connect.query(
      'SELECT order_id FROM `order` WHERE order_id = ?',
      [orderId]
    );
    return result.length > 0;
  }

  // VALIDACIÓN: Orden pertenece al usuario
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

  // VALIDACIÓN: Monto coincide con el total de la orden
  async validateAmountMatchesOrder(orderId, amount) {
    const [result] = await connect.query(
      'SELECT order_total_amount FROM `order` WHERE order_id = ?',
      [orderId]
    );
    
    if (result.length === 0) return false;
    return result[0].order_total_amount === amount;
  }

  // Procesar pago de una orden
  async processPayment(req, res) {
    let connection;
    try {
      const userId = req.user.user_id;
      const { orderId, amount, method, reference } = req.body;

      if (!orderId || !amount || !method || !reference) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // 1. Validar que la orden existe y pertenece al usuario
      const isOwner = await this.validateOrderOwnership(orderId, userId);
      if (!isOwner) {
        await connection.rollback();
        return res.status(403).json({ error: "La orden no pertenece al usuario" });
      }

      // 2. Validar que la orden está pendiente
      const [order] = await connection.query(
        'SELECT order_status, order_total_amount FROM `order` WHERE order_id = ?',
        [orderId]
      );

      if (order.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Orden no encontrada" });
      }

      if (order[0].order_status !== 'Pendiente') {
        await connection.rollback();
        return res.status(400).json({ 
          error: "Solo se pueden pagar órdenes pendientes",
          current_status: order[0].order_status
        });
      }

      // 3. Validar que el monto coincide
      if (order[0].order_total_amount !== amount) {
        await connection.rollback();
        return res.status(400).json({ 
          error: "El monto no coincide con el total de la orden",
          expected: order[0].order_total_amount,
          received: amount
        });
      }

      // 4. Verificar que no haya pagos previos
      const [existingPayment] = await connection.query(
        'SELECT payment_id FROM payment WHERE order_FK = ?',
        [orderId]
      );

      if (existingPayment.length > 0) {
        await connection.rollback();
        return res.status(400).json({ 
          error: "La orden ya tiene pagos registrados" 
        });
      }

      // 5. Registrar el pago
      const [paymentResult] = await connection.query(
        `INSERT INTO payment 
         (payment_amount, payment_method, payment_reference, order_FK, payment_status, created_by) 
         VALUES (?, ?, ?, ?, 'Completado', ?)`,
        [amount, method, reference, orderId, req.user.login]
      );

      // 6. Actualizar estado de la orden a "Pagado"
      await connection.query(
        'UPDATE `order` SET order_status = "Pagado", last_modified_by = ?, updatedAt = NOW() WHERE order_id = ?',
        [req.user.login, orderId]
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        message: "Pago procesado exitosamente",
        data: {
          payment_id: paymentResult.insertId,
          order_id: orderId,
          amount,
          method,
          reference,
          status: 'Completado'
        }
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error processing payment", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  // Obtener pagos de mis órdenes
  async getMyPayments(req, res) {
    try {
      const userId = req.user.user_id;

      const [payments] = await connect.query(
        `SELECT p.*, o.order_id, o.order_total_amount
         FROM payment p
         JOIN \`order\` o ON p.order_FK = o.order_id
         JOIN customer c ON o.customer_FK = c.customer_id
         WHERE c.user_FK = ?
         ORDER BY p.created_at DESC`,
        [userId]
      );

      res.json({
        success: true,
        data: payments
      });

    } catch (error) {
      res.status(500).json({ error: "Error fetching payments", details: error.message });
    }
  }

  // =============================================
  // MÉTODOS CRUD BASE 
  // =============================================

  async addPayment(req, res) {
    let connection;
    try {
      const { amount, method, reference, order } = req.body;

      if (!amount || !method || !reference || !order) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // VALIDACIÓN: Orden existe
      const orderExists = await this.validateOrderExists(order);
      if (!orderExists) {
        return res.status(400).json({ error: "La orden no existe" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO payment 
         (payment_amount, payment_method, payment_reference, order_FK, payment_status, created_by) 
         VALUES (?, ?, ?, ?, 'Completado', ?)`,
        [amount, method, reference, order, req.user?.login || 'system']
      );

      // Actualizar estado de la orden a "Pagado"
      await connection.query(
        'UPDATE `order` SET order_status = "Pagado" WHERE order_id = ?',
        [order]
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        data: [{ id: result.insertId, amount, method, reference, order }],
        message: "Pago registrado exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error adding Payment", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async updatePayment(req, res) {
    let connection;
    try {
      const { amount, method, reference, order } = req.body;
      const paymentId = req.params.id;

      if (!amount || !method || !reference || !order) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");

      const [result] = await connection.query(
        `UPDATE payment 
         SET payment_amount=?, payment_method=?, payment_reference=?, order_FK=?, updatedAt=?, last_modified_by=?
         WHERE payment_id=?`,
        [amount, method, reference, order, update_at, req.user?.login || 'system', paymentId]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Payment not found" });
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        data: [{ amount, method, reference, order, update_at }],
        message: "Pago actualizado exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error updating Payment", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async deletePayment(req, res) {
    let connection;
    try {
      const paymentId = req.params.id;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Obtener order_id antes de eliminar
      const [payment] = await connection.query(
        'SELECT order_FK FROM payment WHERE payment_id = ?',
        [paymentId]
      );

      if (payment.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Payment not found" });
      }

      const orderId = payment[0].order_FK;

      // Eliminar pago
      const [result] = await connection.query('DELETE FROM payment WHERE payment_id = ?', [paymentId]);

      // Verificar si la orden tiene otros pagos
      const [otherPayments] = await connection.query(
        'SELECT payment_id FROM payment WHERE order_FK = ? LIMIT 1',
        [orderId]
      );

      // Si no quedan pagos, revertir orden a Pendiente
      if (otherPayments.length === 0) {
        await connection.query(
          'UPDATE `order` SET order_status = "Pendiente" WHERE order_id = ?',
          [orderId]
        );
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Pago eliminado exitosamente",
        deleted: result.affectedRows
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error deleting Payment", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async showPayment(res) {
    try {
      const [result] = await connect.query(`
        SELECT p.*, o.order_id, o.order_status,
               c.first_name, c.first_last_name
        FROM payment p
        JOIN \`order\` o ON p.order_FK = o.order_id
        JOIN customer c ON o.customer_FK = c.customer_id
        ORDER BY p.created_at DESC
      `);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching Payments", details: error.message });
    }
  }

  async showPaymentById(res, req) {
    try {
      const [result] = await connect.query(
        `SELECT p.*, o.order_id, o.order_status,
                c.first_name, c.first_last_name
         FROM payment p
         JOIN \`order\` o ON p.order_FK = o.order_id
         JOIN customer c ON o.customer_FK = c.customer_id
         WHERE p.payment_id = ?`,
        [req.params.id]
      );

      if (result.length === 0) return res.status(404).json({ error: "Payment not found" });

      res.status(200).json({
        success: true,
        data: result[0]
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching Payment", details: error.message });
    }
  }
}

export default PaymentModel;