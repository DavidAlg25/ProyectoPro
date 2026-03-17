import { connect } from '../config/db/connect.js';

class PurchaseDetailModel {
  constructor(id, quantity, unitPrice, subTotal, purchaseOrder, variant) {
    this.id = id;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
    this.subTotal = subTotal;
    this.purchaseOrder = purchaseOrder;
    this.variant = variant;
  }

  // VALIDACIÓN: Orden de compra existe
  async validatePurchaseOrderExists(orderId) {
    const [result] = await connect.query(
      'SELECT purchaseOrder_id FROM purchaseorder WHERE purchaseOrder_id = ?',
      [orderId]
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

  async addPurchaseDetail(req, res) {
    let connection;
    try {
      const { quantity, unitPrice, subTotal, purchaseOrder, variant } = req.body;

      if (!quantity || !unitPrice || !subTotal || !purchaseOrder || !variant) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (quantity <= 0) {
        return res.status(400).json({ error: "La cantidad debe ser mayor a 0" });
      }

      if (unitPrice <= 0) {
        return res.status(400).json({ error: "El precio debe ser mayor a 0" });
      }

      // Validar que subtotal coincida
      const calculatedSubTotal = quantity * unitPrice;
      if (calculatedSubTotal !== subTotal) {
        return res.status(400).json({ 
          error: "El subtotal no coincide con cantidad * precio unitario",
          calculated: calculatedSubTotal,
          provided: subTotal
        });
      }

      // VALIDACIÓN: Orden de compra existe
      const orderExists = await this.validatePurchaseOrderExists(purchaseOrder);
      if (!orderExists) {
        return res.status(400).json({ error: "La orden de compra no existe" });
      }

      // VALIDACIÓN: Variante existe
      const variantExists = await this.validateVariantExists(variant);
      if (!variantExists) {
        return res.status(400).json({ error: "La variante no existe" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO purchasedetail 
         (purchaseDetail_quantity, purchaseDetail_unitPrice, purchaseDetail_subTotal, purchaseOrder_FK, variant_FK) 
         VALUES (?, ?, ?, ?, ?)`,
        [quantity, unitPrice, subTotal, purchaseOrder, variant]
      );

      // Actualizar total de la orden de compra
      await connection.query(
        'UPDATE purchaseorder SET purchaseOrder_totalAmount = purchaseOrder_totalAmount + ? WHERE purchaseOrder_id = ?',
        [subTotal, purchaseOrder]
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        data: [{ id: result.insertId, quantity, unitPrice, subTotal, purchaseOrder, variant }],
        message: "Detalle de compra agregado exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error adding PurchaseDetail", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async updatePurchaseDetail(req, res) {
    let connection;
    try {
      const { quantity, unitPrice, subTotal, purchaseOrder, variant } = req.body;
      const detailId = req.params.id;

      if (!quantity || !unitPrice || !subTotal || !purchaseOrder || !variant) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (quantity <= 0 || unitPrice <= 0) {
        return res.status(400).json({ error: "Cantidad y precio deben ser mayores a 0" });
      }

      const calculatedSubTotal = quantity * unitPrice;
      if (calculatedSubTotal !== subTotal) {
        return res.status(400).json({ error: "El subtotal no coincide con cantidad * precio unitario" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Obtener el detalle actual para ajustar el total
      const [current] = await connection.query(
        'SELECT purchaseDetail_subTotal FROM purchasedetail WHERE purchaseDetail_id = ?',
        [detailId]
      );

      if (current.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "PurchaseDetail not found" });
      }

      const oldSubTotal = current[0].purchaseDetail_subTotal;
      const difference = subTotal - oldSubTotal;

      const [result] = await connection.query(
        `UPDATE purchasedetail 
         SET purchaseDetail_quantity=?, purchaseDetail_unitPrice=?, purchaseDetail_subTotal=?, purchaseOrder_FK=?, variant_FK=?
         WHERE purchaseDetail_id=?`,
        [quantity, unitPrice, subTotal, purchaseOrder, variant, detailId]
      );

      // Ajustar total de la orden de compra
      if (difference !== 0) {
        await connection.query(
          'UPDATE purchaseorder SET purchaseOrder_totalAmount = purchaseOrder_totalAmount + ? WHERE purchaseOrder_id = ?',
          [difference, purchaseOrder]
        );
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        data: [{ quantity, unitPrice, subTotal, purchaseOrder, variant }],
        message: "Detalle de compra actualizado exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error updating PurchaseDetail", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async deletePurchaseDetail(req, res) {
    let connection;
    try {
      const detailId = req.params.id;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Obtener información del detalle para ajustar total
      const [detail] = await connection.query(
        'SELECT purchaseOrder_FK, purchaseDetail_subTotal FROM purchasedetail WHERE purchaseDetail_id = ?',
        [detailId]
      );

      if (detail.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "PurchaseDetail not found" });
      }

      // Eliminar detalle
      const [result] = await connection.query('DELETE FROM purchasedetail WHERE purchaseDetail_id = ?', [detailId]);

      // Actualizar total de la orden de compra
      await connection.query(
        'UPDATE purchaseorder SET purchaseOrder_totalAmount = purchaseOrder_totalAmount - ? WHERE purchaseOrder_id = ?',
        [detail[0].purchaseDetail_subTotal, detail[0].purchaseOrder_FK]
      );

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Detalle de compra eliminado exitosamente",
        deleted: result.affectedRows
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error deleting PurchaseDetail", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async showPurchaseDetail(res) {
    try {
      const [result] = await connect.query(`
        SELECT pd.*, 
               p.product_name, v.size,
               po.purchaseOrder_status
        FROM purchasedetail pd
        JOIN purchaseorder po ON pd.purchaseOrder_FK = po.purchaseOrder_id
        JOIN productvariants v ON pd.variant_FK = v.variant_id
        JOIN products p ON v.product_FK = p.product_id
        ORDER BY pd.created_at DESC
      `);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching PurchaseDetails", details: error.message });
    }
  }

  async showPurchaseDetailById(res, req) {
    try {
      const [result] = await connect.query(
        `SELECT pd.*, 
                p.product_name, v.size,
                po.purchaseOrder_status
         FROM purchasedetail pd
         JOIN purchaseorder po ON pd.purchaseOrder_FK = po.purchaseOrder_id
         JOIN productvariants v ON pd.variant_FK = v.variant_id
         JOIN products p ON v.product_FK = p.product_id
         WHERE pd.purchaseDetail_id = ?`,
        [req.params.id]
      );

      if (result.length === 0) return res.status(404).json({ error: "PurchaseDetail not found" });

      res.status(200).json({
        success: true,
        data: result[0]
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching PurchaseDetail", details: error.message });
    }
  }
}

export default PurchaseDetailModel;