import { connect } from '../config/db/connect.js';

class InvoiceDetailModel {
  constructor(id, variant, invoice, quantity, unitPrice, subtotal, status) {
    this.id = id;
    this.variant = variant;
    this.invoice = invoice;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
    this.subtotal = subtotal;
    this.status = status;
  }

  // VALIDACIÓN: Factura existe
  async validateInvoiceExists(invoiceId) {
    const [result] = await connect.query(
      'SELECT invoice_id FROM invoice WHERE invoice_id = ?',
      [invoiceId]
    );
    return result.length > 0;
  }

  // VALIDACIÓN: Variante existe
  async validateVariantExists(variantId) {
    const [result] = await connect.query(
      'SELECT variant_id FROM productvariants WHERE variant_id = ?',
      [variantId]
    );
    return result.length > 0;
  }

  // =============================================
  // MÉTODOS CRUD BASE
  // =============================================

  async addInvoiceDetail(req, res) {
    let connection;
    try {
      const { variant, invoice, quantity, unitPrice, subtotal, status } = req.body;

      if (!variant || !invoice || !quantity || !unitPrice || !subtotal || !status) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (quantity <= 0) {
        return res.status(400).json({ error: "La cantidad debe ser mayor a 0" });
      }

      if (unitPrice <= 0) {
        return res.status(400).json({ error: "El precio debe ser mayor a 0" });
      }

      // Validar que subtotal coincida
      const calculatedSubtotal = quantity * unitPrice;
      if (calculatedSubtotal !== subtotal) {
        return res.status(400).json({ 
          error: "El subtotal no coincide con cantidad * precio unitario",
          calculated: calculatedSubtotal,
          provided: subtotal
        });
      }

      // VALIDACIÓN: Factura existe
      const invoiceExists = await this.validateInvoiceExists(invoice);
      if (!invoiceExists) {
        return res.status(400).json({ error: "La factura no existe" });
      }

      // VALIDACIÓN: Variante existe
      const variantExists = await this.validateVariantExists(variant);
      if (!variantExists) {
        return res.status(400).json({ error: "La variante no existe" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO invoicedetail 
         (variant_FK, invoice_FK, quantity, unit_price, subtotal, status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [variant, invoice, quantity, unitPrice, subtotal, status]
      );

      // Actualizar total de la factura
      await connection.query(
        'UPDATE invoice SET total_amount = total_amount + ? WHERE invoice_id = ?',
        [subtotal, invoice]
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        data: [{ id: result.insertId, variant, invoice, quantity, unitPrice, subtotal, status }],
        message: "Detalle de factura agregado exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error adding InvoiceDetail", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async updateInvoiceDetail(req, res) {
    let connection;
    try {
      const { variant, invoice, quantity, unitPrice, subtotal, status } = req.body;
      const detailId = req.params.id;

      if (!variant || !invoice || !quantity || !unitPrice || !subtotal || !status) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (quantity <= 0) {
        return res.status(400).json({ error: "La cantidad debe ser mayor a 0" });
      }

      if (unitPrice <= 0) {
        return res.status(400).json({ error: "El precio debe ser mayor a 0" });
      }

      const calculatedSubtotal = quantity * unitPrice;
      if (calculatedSubtotal !== subtotal) {
        return res.status(400).json({ 
          error: "El subtotal no coincide con cantidad * precio unitario" 
        });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Obtener el detalle actual para ajustar el total
      const [current] = await connection.query(
        'SELECT subtotal FROM invoicedetail WHERE invoice_detail_id = ?',
        [detailId]
      );

      if (current.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "InvoiceDetail not found" });
      }

      const oldSubtotal = current[0].subtotal;
      const difference = subtotal - oldSubtotal;

      const [result] = await connection.query(
        `UPDATE invoicedetail 
         SET variant_FK=?, invoice_FK=?, quantity=?, unit_price=?, subtotal=?, status=?
         WHERE invoice_detail_id=?`,
        [variant, invoice, quantity, unitPrice, subtotal, status, detailId]
      );

      // Ajustar total de la factura
      if (difference !== 0) {
        await connection.query(
          'UPDATE invoice SET total_amount = total_amount + ? WHERE invoice_id = ?',
          [difference, invoice]
        );
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        data: [{ variant, invoice, quantity, unitPrice, subtotal, status }],
        message: "Detalle de factura actualizado exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error updating InvoiceDetail", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async deleteInvoiceDetail(req, res) {
    let connection;
    try {
      const detailId = req.params.id;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Obtener información del detalle para ajustar total
      const [detail] = await connection.query(
        'SELECT invoice_FK, subtotal FROM invoicedetail WHERE invoice_detail_id = ?',
        [detailId]
      );

      if (detail.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "InvoiceDetail not found" });
      }

      // Eliminar detalle
      const [result] = await connection.query('DELETE FROM invoicedetail WHERE invoice_detail_id = ?', [detailId]);

      // Actualizar total de la factura
      await connection.query(
        'UPDATE invoice SET total_amount = total_amount - ? WHERE invoice_id = ?',
        [detail[0].subtotal, detail[0].invoice_FK]
      );

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Detalle de factura eliminado exitosamente",
        deleted: result.affectedRows
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error deleting InvoiceDetail", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async showInvoiceDetail(res) {
    try {
      const [result] = await connect.query(`
        SELECT id.*, 
               p.product_name, v.size,
               i.invoice_id, i.status as invoice_status
        FROM invoicedetail id
        JOIN invoice i ON id.invoice_FK = i.invoice_id
        JOIN productvariants v ON id.variant_FK = v.variant_id
        JOIN products p ON v.product_FK = p.product_id
        ORDER BY id.created_at DESC
      `);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching InvoiceDetails", details: error.message });
    }
  }

  async showInvoiceDetailById(res, req) {
    try {
      const [result] = await connect.query(
        `SELECT id.*, 
                p.product_name, v.size,
                i.invoice_id, i.status as invoice_status
         FROM invoicedetail id
         JOIN invoice i ON id.invoice_FK = i.invoice_id
         JOIN productvariants v ON id.variant_FK = v.variant_id
         JOIN products p ON v.product_FK = p.product_id
         WHERE id.invoice_detail_id = ?`,
        [req.params.id]
      );

      if (result.length === 0) return res.status(404).json({ error: "InvoiceDetail not found" });

      res.status(200).json({
        success: true,
        data: result[0]
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching InvoiceDetail", details: error.message });
    }
  }
}

export default InvoiceDetailModel;