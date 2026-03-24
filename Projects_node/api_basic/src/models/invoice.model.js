import { connect } from '../config/db/connect.js';

class InvoiceModel {
  constructor(id, user, customer, order, totalAmount, status) {
    this.id = id;
    this.user = user;
    this.customer = customer;
    this.order = order;
    this.totalAmount = totalAmount;
    this.status = status;
  }

  // VALIDACIÓN: Orden existe y está pagada
  async validateOrderForInvoice(orderId) {
    const [result] = await connect.query(
      'SELECT order_id, order_status FROM `order` WHERE order_id = ?',
      [orderId]
    );
    
    if (result.length === 0) {
      return { exists: false };
    }
    
    return {
      exists: true,
      isPaid: result[0].order_status === 'Pagado',
      order: result[0]
    };
  }

  // VALIDACIÓN: No existe factura para esta orden
  async validateNoInvoiceForOrder(orderId) {
    const [result] = await connect.query(
      'SELECT invoice_id FROM invoice WHERE order_FK = ?',
      [orderId]
    );
    return result.length === 0;
  }

  // VALIDACIÓN: La factura pertenece al usuario
  async validateInvoiceOwnership(invoiceId, userId) {
    const [result] = await connect.query(
      `SELECT i.invoice_id 
       FROM invoice i
       JOIN customer c ON i.customer_FK = c.customer_id
       WHERE i.invoice_id = ? AND c.user_FK = ?`,
      [invoiceId, userId]
    );
    return result.length > 0;
  }

  // Generar factura desde una orden pagada
  async generateInvoiceFromOrder(req, res) {
    let connection;
    try {
      const { orderId } = req.body;
      const userId = req.user.user_id;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // 1. Validar que la orden existe y está pagada
      const orderCheck = await this.validateOrderForInvoice(orderId);
      if (!orderCheck.exists) {
        await connection.rollback();
        return res.status(404).json({ error: "Orden no encontrada" });
      }

      if (!orderCheck.isPaid) {
        await connection.rollback();
        return res.status(400).json({ 
          error: "Solo se pueden facturar órdenes pagadas",
          order_status: orderCheck.order.order_status
        });
      }

      // 2. Validar que no exista factura previa
      const noInvoice = await this.validateNoInvoiceForOrder(orderId);
      if (!noInvoice) {
        await connection.rollback();
        return res.status(400).json({ error: "La orden ya tiene una factura asociada" });
      }

      // 3. Obtener detalles de la orden
      const [orderDetails] = await connection.query(
        `SELECT o.customer_FK, o.order_total_amount,
                od.variant_FK, od.order_detail_quantity, od.order_detail_unit_price
         FROM \`order\` o
         JOIN orderdetail od ON o.order_id = od.order_id
         WHERE o.order_id = ?`,
        [orderId]
      );

      if (orderDetails.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: "La orden no tiene detalles" });
      }

      // 4. Obtener customer_id y user_id
      const [customer] = await connection.query(
        'SELECT customer_id, user_FK FROM customer WHERE customer_id = ?',
        [orderDetails[0].customer_FK]
      );

      // 5. Crear la factura
      const [invoiceResult] = await connection.query(
        `INSERT INTO invoice 
         (user_FK, customer_FK, order_FK, total_amount, status, created_by) 
         VALUES (?, ?, ?, ?, 'Emitida', ?)`,
        [customer[0].user_FK, orderDetails[0].customer_FK, orderId, 
         orderDetails[0].order_total_amount, req.user.login]
      );

      const invoiceId = invoiceResult.insertId;

      // 6. Crear detalles de factura
      for (const detail of orderDetails) {
        const subtotal = detail.order_detail_quantity * detail.order_detail_unit_price;
        
        await connection.query(
          `INSERT INTO invoicedetail 
           (variant_FK, invoice_FK, quantity, unit_price, subtotal, status) 
           VALUES (?, ?, ?, ?, ?, 'Activo')`,
          [detail.variant_FK, invoiceId, detail.order_detail_quantity, 
           detail.order_detail_unit_price, subtotal]
        );
      }

      await connection.query(
      `UPDATE inventorymovement 
       SET invoice_FK = ?
       WHERE variant_FK IN (
         SELECT variant_FK FROM orderdetail WHERE order_id = ?
       )
       AND movement_type = 'Salida'
       AND invoice_FK IS NULL`,
      [invoiceId, orderId]
    );

      await connection.commit();

      res.status(201).json({
        success: true,
        message: "Factura generada exitosamente",
        data: {
          invoice_id: invoiceId,
          order_id: orderId,
          total_amount: orderDetails[0].order_total_amount,
          status: 'Emitida'
        }
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error generating invoice", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  // Obtener facturas del cliente autenticado
  async getMyInvoices(req, res) {
    try {
      const userId = req.user.user_id;

      const [invoices] = await connect.query(
        `SELECT i.*,
                (SELECT COUNT(*) FROM invoicedetail WHERE invoice_FK = i.invoice_id) as item_count
         FROM invoice i
         JOIN customer c ON i.customer_FK = c.customer_id
         WHERE c.user_FK = ?
         ORDER BY i.createdAt DESC`,
        [userId]
      );

      res.json({
        success: true,
        data: invoices
      });

    } catch (error) {
      res.status(500).json({ error: "Error fetching invoices", details: error.message });
    }
  }

  // Obtener detalle completo de una factura
async getInvoiceDetails(req, res) {
  try {
    const userId = req.user.user_id;
    const invoiceId = req.params.id;

    // Verificar propiedad (si es cliente)
    const isOwner = await this.validateInvoiceOwnership(invoiceId, userId);
    if (!isOwner && !req.user.roles.some(r => r.role_name === 'admin')) {
      return res.status(403).json({ error: "No tienes permiso para ver esta factura" });
    }

    // 1. Obtener información de la factura
    const [invoice] = await connect.query(
      `SELECT i.* 
       FROM invoice i
       WHERE i.invoice_id = ?`,
      [invoiceId]
    );

    if (invoice.length === 0) {
      return res.status(404).json({ error: "Factura no encontrada" });
    }

    // 2. Obtener los detalles de la factura
    const [details] = await connect.query(
      `SELECT 
         id.invoice_detail_id as detail_id,
         id.variant_FK as variant_id,
         id.quantity,
         id.unit_price,
         id.subtotal,
         p.product_name,
         v.size,
         p.image_url
       FROM invoicedetail id
       LEFT JOIN productvariants v ON id.variant_FK = v.variant_id
       LEFT JOIN products p ON v.product_FK = p.product_id
       WHERE id.invoice_FK = ?`,
      [invoiceId]
    );

    // 3. Construir la respuesta
    res.json({
      success: true,
      data: {
        ...invoice[0],
        details: details || []
      }
    });

  } catch (error) {
    console.error('Error en getInvoiceDetails:', error);
    res.status(500).json({ error: "Error fetching invoice details", details: error.message });
  }
}

  // Anular factura (solo si no tiene movimientos asociados)
  // Anular factura (permite cancelar incluso si ya tiene movimientos asociados)
async cancelInvoice(req, res) {
  let connection;
  try {
    const invoiceId = req.params.id;

    connection = await connect.getConnection();
    await connection.beginTransaction();

    // 1. Obtener factura y verificar que existe
    const [invoice] = await connection.query(
      `SELECT i.* 
       FROM invoice i
       WHERE i.invoice_id = ?`,
      [invoiceId]
    );
    if (invoice.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Factura no encontrada" });
    }

    // 2. Verificar que no esté ya anulada
    if (invoice[0].status === 'Anulada') {
      await connection.rollback();
      return res.status(400).json({ error: "La factura ya está anulada" });
    }

    // 3. (Opcional) Si quieres registrar en el log que se anula con movimientos, pero sin bloquear
    const [movements] = await connection.query(
      'SELECT COUNT(*) as total FROM inventorymovement WHERE invoice_FK = ?',
      [invoiceId]
    );
    if (movements[0].total > 0) {
      console.log(`Factura ${invoiceId} anulada con ${movements[0].total} movimientos asociados`);
    }

    // 4. Cambiar estado a "Anulada"
    await connection.query(
      'UPDATE invoice SET status = "Anulada", last_modified_by = ?, updatedAt = NOW() WHERE invoice_id = ?',
      [req.user?.login || 'system', invoiceId]
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Factura anulada exitosamente"
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error cancelInvoice:', error);
    res.status(500).json({ error: "Error cancelando factura", details: error.message });
  } finally {
    if (connection) connection.release();
  }
}

  // =============================================
  // MÉTODOS CRUD BASE 
  // =============================================

   async showInvoice(res) {
    try {
      const [result] = await connect.query(`
        SELECT i.*, 
               COUNT(id.invoice_detail_id) as item_count,
               c.first_name, c.first_last_name,
               o.order_id, o.order_status
        FROM invoice i
        LEFT JOIN invoicedetail id ON i.invoice_id = id.invoice_FK
        LEFT JOIN customer c ON i.customer_FK = c.customer_id
        LEFT JOIN \`order\` o ON i.order_FK = o.order_id
        GROUP BY i.invoice_id
        ORDER BY i.createdAt DESC
      `);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching Invoices", details: error.message });
    }
  }

  async showInvoiceById(res, req) {
    try {
      const invoiceId = req.params.id;

      // 1. Obtener información de la factura
      const [invoice] = await connect.query(
        `SELECT i.* 
        FROM invoice i
        WHERE i.invoice_id = ?`,
        [invoiceId]
      );

      if (invoice.length === 0) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // 2. Obtener los detalles de la factura
      const [details] = await connect.query(
        `SELECT 
          id.invoice_detail_id as detail_id,
          id.variant_FK as variant_id,
          id.quantity,
          id.unit_price,
          id.subtotal
        FROM invoicedetail id
        WHERE id.invoice_FK = ?`,
        [invoiceId]
      );

      // 3. Construir la respuesta
      res.status(200).json({
        success: true,
        data: {
          ...invoice[0],
          details: details || []
        }
      });

    } catch (error) {
      console.error('Error en showInvoiceById:', error);
      res.status(500).json({ error: "Error fetching Invoice", details: error.message });
    }
  }
}

export default InvoiceModel;