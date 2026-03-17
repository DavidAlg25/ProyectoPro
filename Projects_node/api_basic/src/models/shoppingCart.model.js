import { connect } from '../config/db/connect.js';

class ShoppingCartModel {
  constructor(id, shoppingCart_status, customer) {
    this.id = id;
    this.shoppingCart_status = shoppingCart_status;
    this.customer = customer;
  }

  // VALIDACIÓN: Obtener carrito activo del cliente
  async getActiveCartByCustomer(customerId) {
    const [result] = await connect.query(
      `SELECT * FROM shoppingcart 
       WHERE customer_FK = ? AND shoppingCart_status = 'Activo'`,
      [customerId]
    );
    return result.length > 0 ? result[0] : null;
  }

  // VALIDACIÓN: Verificar que el cliente existe
  async validateCustomerExists(customerId) {
    const [result] = await connect.query(
      'SELECT customer_id FROM customer WHERE customer_id = ?',
      [customerId]
    );
    return result.length > 0;
  }

  // Obtener carrito del usuario autenticado
  async getMyCart(req, res) {
    try {
      const userId = req.user.user_id;

      // Obtener customer_id del usuario
      const [customer] = await connect.query(
        'SELECT customer_id FROM customer WHERE user_FK = ?',
        [userId]
      );

      if (customer.length === 0) {
        return res.status(404).json({ error: "Cliente no encontrado" });
      }

      const customerId = customer[0].customer_id;

      // Obtener carrito activo con sus items
      const [cart] = await connect.query(
        `SELECT 
           sc.shoppingCart_id,
           sc.shoppingCart_status,
           JSON_ARRAYAGG(
             JSON_OBJECT(
               'cartItem_id', ci.cartItem_id,
               'variant_id', ci.variant_FK,
               'quantity', ci.cartItem_quantity,
               'unit_price', ci.cartItem_unitPrice,
               'product_name', p.product_name,
               'size', v.size,
               'image_url', p.image_url
             )
           ) as items,
           SUM(ci.cartItem_quantity * ci.cartItem_unitPrice) as total
         FROM shoppingcart sc
         LEFT JOIN cartitem ci ON sc.shoppingCart_id = ci.shoppingCart_FK
         LEFT JOIN productvariants v ON ci.variant_FK = v.variant_id
         LEFT JOIN products p ON v.product_FK = p.product_id
         WHERE sc.customer_FK = ? AND sc.shoppingCart_status = 'Activo'
         GROUP BY sc.shoppingCart_id`,
        [customerId]
      );

      if (cart.length === 0) {
        // Si no hay carrito activo, crear uno
        const [newCart] = await connect.query(
          'INSERT INTO shoppingcart (customer_FK, shoppingCart_status) VALUES (?, "Activo")',
          [customerId]
        );

        return res.status(200).json({
          success: true,
          data: {
            shoppingCart_id: newCart.insertId,
            shoppingCart_status: 'Activo',
            items: [],
            total: 0
          }
        });
      }

      res.status(200).json({
        success: true,
        data: cart[0]
      });

    } catch (error) {
      res.status(500).json({ error: "Error fetching cart", details: error.message });
    }
  }

  // Vaciar carrito
  async clearCart(req, res) {
    let connection;
    try {
      const userId = req.user.user_id;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Obtener customer_id
      const [customer] = await connection.query(
        'SELECT customer_id FROM customer WHERE user_FK = ?',
        [userId]
      );

      if (customer.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Cliente no encontrado" });
      }

      // Obtener carrito activo
      const [cart] = await connection.query(
        'SELECT shoppingCart_id FROM shoppingcart WHERE customer_FK = ? AND shoppingCart_status = "Activo"',
        [customer[0].customer_id]
      );

      if (cart.length > 0) {
        // Eliminar items del carrito
        await connection.query(
          'DELETE FROM cartitem WHERE shoppingCart_FK = ?',
          [cart[0].shoppingCart_id]
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: "Carrito vaciado exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error clearing cart", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  // Procesar carrito (para checkout)
  async processCart(req, res) {
    let connection;
    try {
      const userId = req.user.user_id;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Obtener customer_id
      const [customer] = await connection.query(
        'SELECT customer_id FROM customer WHERE user_FK = ?',
        [userId]
      );

      if (customer.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Cliente no encontrado" });
      }

      // Obtener carrito activo con items
      const [cart] = await connection.query(
        `SELECT sc.shoppingCart_id, 
                ci.cartItem_id, ci.variant_FK, ci.cartItem_quantity
         FROM shoppingcart sc
         JOIN cartitem ci ON sc.shoppingCart_id = ci.shoppingCart_FK
         WHERE sc.customer_FK = ? AND sc.shoppingCart_status = 'Activo'`,
        [customer[0].customer_id]
      );

      if (cart.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: "El carrito está vacío" });
      }

      // Verificar stock de cada item
      for (const item of cart) {
        const [inventory] = await connection.query(
          'SELECT stock FROM inventory WHERE variant_FK = ?',
          [item.variant_FK]
        );

        if (inventory.length === 0 || inventory[0].stock < item.cartItem_quantity) {
          await connection.rollback();
          return res.status(400).json({ 
            error: "Stock insuficiente para uno o más productos" 
          });
        }
      }

      // Marcar carrito como procesado
      await connection.query(
        'UPDATE shoppingcart SET shoppingCart_status = "Procesado" WHERE shoppingCart_id = ?',
        [cart[0].shoppingCart_id]
      );

      await connection.commit();

      res.json({
        success: true,
        message: "Carrito procesado exitosamente",
        data: {
          shoppingCart_id: cart[0].shoppingCart_id,
          itemCount: cart.length
        }
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error processing cart", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  // =============================================
  // MÉTODOS CRUD BASE 
  // =============================================

  async addShoppingCart(req, res) {
    let connection;
    try {
      const { shoppingCart_status, customer } = req.body;
      
      if (!shoppingCart_status || !customer) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // VALIDACIÓN: Cliente existe
      const customerExists = await this.validateCustomerExists(customer);
      if (!customerExists) {
        return res.status(400).json({ error: "El cliente no existe" });
      }

      // VALIDACIÓN: No tener carrito activo
      const activeCart = await this.getActiveCartByCustomer(customer);
      if (activeCart) {
        return res.status(400).json({ 
          error: "El cliente ya tiene un carrito activo",
          activeCartId: activeCart.shoppingCart_id
        });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      let sqlQuery = "INSERT INTO shoppingcart (shoppingCart_status, customer_FK) VALUES (?, ?)";
      const [result] = await connection.query(sqlQuery, [shoppingCart_status, customer]);

      await connection.commit();

      res.status(201).json({
        success: true,
        data: [{ id: result.insertId, shoppingCart_status, customer }],
        message: "Carrito creado exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error adding ShoppingCart", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async updateShoppingCart(req, res) {
    let connection;
    try {
      const { shoppingCart_status, customer } = req.body;
      const cartId = req.params.id;

      if (!shoppingCart_status || !customer) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");

      let sqlQuery = "UPDATE shoppingcart SET shoppingCart_status=?, customer_FK=?, updatedAt=? WHERE shoppingCart_id=?";
      const [result] = await connection.query(sqlQuery, [shoppingCart_status, customer, update_at, cartId]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "ShoppingCart not found" });
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        data: [{ shoppingCart_status, customer, update_at }],
        message: "Carrito actualizado exitosamente"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error updating ShoppingCart", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async deleteShoppingCart(req, res) {
    let connection;
    try {
      const cartId = req.params.id;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Verificar si tiene items
      const [items] = await connection.query(
        'SELECT cartItem_id FROM cartitem WHERE shoppingCart_FK = ? LIMIT 1',
        [cartId]
      );

      if (items.length > 0) {
        // Soft delete: solo cambiar estado
        await connection.query(
          'UPDATE shoppingcart SET shoppingCart_status = "Eliminado" WHERE shoppingCart_id = ?',
          [cartId]
        );

        await connection.commit();

        return res.status(200).json({
          success: true,
          message: "Carrito desactivado (tenía items asociados)",
          softDelete: true
        });
      }

      // Si no tiene items, eliminar físicamente
      let sqlQuery = "DELETE FROM shoppingcart WHERE shoppingCart_id = ?";
      const [result] = await connection.query(sqlQuery, [cartId]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "ShoppingCart not found" });
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Carrito eliminado exitosamente",
        deleted: result.affectedRows
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error deleting ShoppingCart", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async showShoppingCart(res) {
    try {
      let sqlQuery = `
        SELECT sc.*, 
               COUNT(ci.cartItem_id) as item_count,
               SUM(ci.cartItem_quantity * ci.cartItem_unitPrice) as total
        FROM shoppingcart sc
        LEFT JOIN cartitem ci ON sc.shoppingCart_id = ci.shoppingCart_FK
        GROUP BY sc.shoppingCart_id
      `;
      const [result] = await connect.query(sqlQuery);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching ShoppingCarts", details: error.message });
    }
  }

  async showShoppingCartById(res, req) {
    try {
      const [result] = await connect.query(
        `SELECT sc.*, 
                JSON_ARRAYAGG(
                  JSON_OBJECT(
                    'cartItem_id', ci.cartItem_id,
                    'variant_id', ci.variant_FK,
                    'quantity', ci.cartItem_quantity,
                    'unit_price', ci.cartItem_unitPrice
                  )
                ) as items,
                SUM(ci.cartItem_quantity * ci.cartItem_unitPrice) as total
         FROM shoppingcart sc
         LEFT JOIN cartitem ci ON sc.shoppingCart_id = ci.shoppingCart_FK
         WHERE sc.shoppingCart_id = ?
         GROUP BY sc.shoppingCart_id`,
        [req.params.id]
      );
      
      if (result.length === 0) return res.status(404).json({ error: "ShoppingCart not found" });
      
      res.status(200).json({
        success: true,
        data: result[0]
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching ShoppingCart", details: error.message });
    }
  }
}

export default ShoppingCartModel;