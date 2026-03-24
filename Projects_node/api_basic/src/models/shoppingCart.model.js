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

      // 1. Obtener el carrito activo
      const [cart] = await connect.query(
        `SELECT shoppingCart_id, shoppingCart_status 
        FROM shoppingcart 
        WHERE customer_FK = ? AND shoppingCart_status = 'Activo'`,
        [customerId]
      );

      // Si no hay carrito activo, crear uno
      if (cart.length === 0) {
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

      const cartId = cart[0].shoppingCart_id;

      // 2. Obtener los items del carrito por separado
      const [items] = await connect.query(
        `SELECT 
          ci.cartItem_id,
          ci.variant_FK as variant_id,
          ci.cartItem_quantity as quantity,
          ci.cartItem_unitPrice as unit_price,
          p.product_name,
          v.size,
          p.image_url
        FROM cartitem ci
        LEFT JOIN productvariants v ON ci.variant_FK = v.variant_id
        LEFT JOIN products p ON v.product_FK = p.product_id
        WHERE ci.shoppingCart_FK = ?`,
        [cartId]
      );

      // 3. Calcular el total
      let total = 0;
      items.forEach(item => {
        total += item.quantity * item.unit_price;
      });

      // 4. Construir la respuesta
      res.status(200).json({
        success: true,
        data: {
          shoppingCart_id: cartId,
          shoppingCart_status: cart[0].shoppingCart_status,
          items: items || [],
          total: total
        }
      });

    } catch (error) {
      console.error('Error en getMyCart:', error);
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

      const update_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota", hour12: false }).replace(",", "").replace("/", "-").replace("/", "-");

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
    const cartId = req.params.id;

    // 1. Obtener información del carrito
    const [cart] = await connect.query(
      `SELECT sc.* 
       FROM shoppingcart sc
       WHERE sc.shoppingCart_id = ?`,
      [cartId]
    );
    
    if (cart.length === 0) {
      return res.status(404).json({ error: "ShoppingCart not found" });
    }

    // 2. Obtener los items del carrito por separado
    const [items] = await connect.query(
      `SELECT 
         ci.cartItem_id,
         ci.variant_FK as variant_id,
         ci.cartItem_quantity as quantity,
         ci.cartItem_unitPrice as unit_price
       FROM cartitem ci
       WHERE ci.shoppingCart_FK = ?`,
      [cartId]
    );

    // 3. Calcular el total
    let total = 0;
    items.forEach(item => {
      total += item.quantity * item.unit_price;
    });

    // 4. Construir la respuesta
    res.status(200).json({
      success: true,
      data: {
        shoppingCart_id: cart[0].shoppingCart_id,
        shoppingCart_status: cart[0].shoppingCart_status,
        customer_FK: cart[0].customer_FK,
        created_at: cart[0].created_at,
        updatedAt: cart[0].updatedAt,
        items: items || [],
        total: total
      }
    });

  } catch (error) {
    console.error('Error en showShoppingCartById:', error);
    res.status(500).json({ error: "Error fetching ShoppingCart", details: error.message });
  }
}
}

export default ShoppingCartModel;