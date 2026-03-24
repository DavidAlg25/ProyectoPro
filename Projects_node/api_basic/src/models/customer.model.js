// customer.model.js
import { connect } from '../config/db/connect.js';

class CustomerModel {
  constructor(id, user, doc_type, document_number, first_name, second_name, first_last_name, second_last_name, email, phone) {
    this.id = id;
    this.user = user;
    this.doc_type = doc_type;
    this.document_number = document_number;
    this.first_name = first_name;
    this.second_name = second_name;
    this.first_last_name = first_last_name;
    this.second_last_name = second_last_name;
    this.email = email;
    this.phone = phone;
  }

  async addCustomer(req, res) {
    try {
      const { user_FK, doc_type_id, document_number, first_name, second_name, first_last_name, second_last_name, email, phone } = req.body;

      // Validar campos obligatorios (solo los que son realmente necesarios)
      if (!doc_type_id || !document_number || !first_name || !first_last_name) {
        return res.status(400).json({ error: "Faltan campos obligatorios: tipo documento, número documento, primer nombre y primer apellido" });
      }

      // Si se proporciona user_FK, verificar que exista
      if (user_FK) {
        const [user] = await connect.query('SELECT user_id FROM user WHERE user_id = ?', [user_FK]);
        if (user.length === 0) {
          return res.status(400).json({ error: "El usuario especificado no existe" });
        }
      }

      let sqlQuery = `
        INSERT INTO customer 
        (user_FK, doc_type_id, document_number, first_name, second_name, first_last_name, second_last_name, email, phone) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await connect.query(sqlQuery, [
        user_FK || null,
        doc_type_id,
        document_number,
        first_name,
        second_name || null,
        first_last_name,
        second_last_name || null,
        email || null,
        phone || null
      ]);

      res.status(201).json({
        success: true,
        data: [{ id: result.insertId, user_FK, doc_type_id, document_number, first_name, second_name, first_last_name, second_last_name, email, phone }],
        message: "Cliente creado exitosamente"
      });

    } catch (error) {
      console.error('Error en addCustomer:', error);
      res.status(500).json({ error: "Error adding Customer", details: error.message });
    }
  }

  async updateCustomer(req, res) {
    try {
      const { user_FK, doc_type_id, document_number, first_name, second_name, first_last_name, second_last_name, email, phone } = req.body;
      const customerId = req.params.id;

      // Validar campos obligatorios
      if (!doc_type_id || !document_number || !first_name || !first_last_name) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      // Si se envía user_FK, verificar existencia
      if (user_FK) {
        const [user] = await connect.query('SELECT user_id FROM user WHERE user_id = ?', [user_FK]);
        if (user.length === 0) {
          return res.status(400).json({ error: "El usuario especificado no existe" });
        }
      }

      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota", hour12: false }).replace(",", "").replace("/", "-").replace("/", "-");
      const sqlQuery = `
        UPDATE customer 
        SET user_FK=?, doc_type_id=?, document_number=?, first_name=?, second_name=?, first_last_name=?, second_last_name=?, email=?, phone=?, updatedAt=? 
        WHERE customer_id=?
      `;
      const [result] = await connect.query(sqlQuery, [
        user_FK || null,
        doc_type_id,
        document_number,
        first_name,
        second_name || null,
        first_last_name,
        second_last_name || null,
        email || null,
        phone || null,
        update_at,
        customerId
      ]);

      if (result.affectedRows === 0) return res.status(404).json({ error: "Customer not found" });

      res.status(200).json({
        success: true,
        data: [{ user_FK, doc_type_id, document_number, first_name, second_name, first_last_name, second_last_name, email, phone, update_at }],
        message: "Cliente actualizado exitosamente"
      });

    } catch (error) {
      console.error('Error en updateCustomer:', error);
      res.status(500).json({ error: "Error updating Customer", details: error.message });
    }
  }

  async deleteCustomer(req, res) {
    try {
      const customerId = req.params.id;
      // Primero verificar si tiene órdenes asociadas (para evitar borrar clientes con historial)
      const [orders] = await connect.query('SELECT order_id FROM `order` WHERE customer_FK = ? LIMIT 1', [customerId]);
      if (orders.length > 0) {
        return res.status(400).json({ error: "No se puede eliminar el cliente porque tiene órdenes asociadas" });
      }

      let sqlQuery = "DELETE FROM customer WHERE customer_id = ?";
      const [result] = await connect.query(sqlQuery, [customerId]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Customer not found" });

      res.status(200).json({
        success: true,
        message: "Cliente eliminado exitosamente",
        deleted: result.affectedRows
      });
    } catch (error) {
      console.error('Error en deleteCustomer:', error);
      res.status(500).json({ error: "Error deleting Customer", details: error.message });
    }
  }

  async showCustomer(res) {
    try {
      // Incluir datos del usuario si existe, para mostrar login/email si está asociado
      let sqlQuery = `
        SELECT c.*, u.login as user_login, u.email as user_email
        FROM customer c
        LEFT JOIN user u ON c.user_FK = u.user_id
      `;
      const [result] = await connect.query(sqlQuery);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error en showCustomer:', error);
      res.status(500).json({ error: "Error fetching Customers", details: error.message });
    }
  }

  async showCustomerById(res, req) {
    try {
      const customerId = req.params.id;
      const [result] = await connect.query(`
        SELECT c.*, u.login as user_login, u.email as user_email
        FROM customer c
        LEFT JOIN user u ON c.user_FK = u.user_id
        WHERE c.customer_id = ?
      `, [customerId]);
      if (result.length === 0) return res.status(404).json({ error: "Customer not found" });
      res.status(200).json({
        success: true,
        data: result[0]
      });
    } catch (error) {
      console.error('Error en showCustomerById:', error);
      res.status(500).json({ error: "Error fetching Customer", details: error.message });
    }
  }
}

export default CustomerModel;