import { connect } from '../config/db/connect.js';

class CartItemModel {
  constructor(id, quantity, unitPrice, shoppingCart, variant) {
    this.id = id;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
    this.shoppingCart = shoppingCart;
    this.variant = variant;
  }

  // VALIDACIÓN: Variante existe y está activa
  async validateVariantActive(variantId) {
    const [result] = await connect.query(
      `SELECT v.*, p.status as product_status 
       FROM productvariants v
       JOIN products p ON v.product_FK = p.product_id
       WHERE v.variant_id = ?`,
      [variantId]
    );
    
    if (result.length === 0) return { exists: false };
    
    return {
      exists: true,
      active: result[0].status === 'Activo' && result[0].product_status === 'Activo',
      unit_price: result[0].unit_price,
      variant: result[0]
    };
  }

  // VALIDACIÓN: Stock disponible
  async validateStock(variantId, requestedQuantity) {
    const [result] = await connect.query(
      'SELECT stock FROM inventory WHERE variant_FK = ?',
      [variantId]
    );
    
    const currentStock = result.length > 0 ? result[0].stock : 0;
    return {
      available: currentStock >= requestedQuantity,
      currentStock
    };
  }

  // VALIDACIÓN: Carrito existe y está activo
  async validateCartActive(cartId) {
    const [result] = await connect.query(
      'SELECT * FROM shoppingcart WHERE shoppingCart_id = ? AND shoppingCart_status = "Activo"',
      [cartId]
    );
    return result.length > 0;
  }

  // VALIDACIÓN: El carrito pertenece al usuario
  async validateCartOwnership(cartId, userId) {
    const [result] = await connect.query(
      `SELECT sc.shoppingCart_id 
       FROM shoppingcart sc
       JOIN customer c ON sc.customer_FK = c.customer_id
       WHERE sc.shoppingCart_id = ? AND c.user_FK = ?`,
      [cartId, userId]
    );
    return result.length > 0;
  }

  // Agregar item al carrito 
  async addToCart(req, res) {
    let connection;
    try {
      const userId = req.user.user_id;
      const { variant_id, quantity } = req.body;

      if (!variant_id || !quantity || quantity <= 0) {
        return res.status(400).json({ error: "Datos inválidos" });
      }

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

      // 2. Obtener o crear carrito activo
      let [cart] = await connection.query(
        'SELECT shoppingCart_id FROM shoppingcart WHERE customer_FK = ? AND shoppingCart_status = "Activo"',
        [customer[0].customer_id]
      );

      let cartId;
      if (cart.length === 0) {
        const [newCart] = await connection.query(
          'INSERT INTO shoppingcart (customer_FK, shoppingCart_status) VALUES (?, "Activo")',
          [customer[0].customer_id]
        );
        cartId = newCart.insertId;
      } else {
        cartId = cart[0].shoppingCart_id;
      }

      // 3. VALIDACIÓN: Variante existe y está activa
      const variantCheck = await this.validateVariantActive(variant_id);
      if (!variantCheck.exists) {
        await connection.rollback();
        return res.status(400).json({ error: "La variante no existe" });
      }
      if (!variantCheck.active) {
        await connection.rollback();
        return res.status(400).json({ error: "La variante no está disponible" });
      }

      // 4. VALIDACIÓN: Stock suficiente
      const stockCheck = await this.validateStock(variant_id, quantity);
      if (!stockCheck.available) {
        await connection.rollback();
        return res.status(400).json({ 
          error: "Stock insuficiente",
          available: stockCheck.currentStock,
          requested: quantity
        });
      }

      // 5. Verificar si ya existe el item en el carrito
      const [existingItem] = await connection.query(
        'SELECT cartItem_id, cartItem_quantity FROM cartitem WHERE shoppingCart_FK = ? AND variant_FK = ?',
        [cartId, variant_id]
      );

      if (existingItem.length > 0) {
        // Actualizar cantidad
        const newQuantity = existingItem[0].cartItem_quantity + quantity;
        
        // Validar stock nuevamente con la nueva cantidad
        const stockCheck2 = await this.validateStock(variant_id, newQuantity);
        if (!stockCheck2.available) {
          await connection.rollback();
          return res.status(400).json({ 
            error: "Stock insuficiente para la cantidad total",
            available: stockCheck2.currentStock,
            requested: newQuantity
          });
        }

        await connection.query(
          'UPDATE cartitem SET cartItem_quantity = ? WHERE cartItem_id = ?',
          [newQuantity, existingItem[0].cartItem_id]
        );
      } else {
        // Insertar nuevo item
        await connection.query(
          `INSERT INTO cartitem 
           (cartItem_quantity, cartItem_unitPrice, shoppingCart_FK, variant_FK) 
           VALUES (?, ?, ?, ?)`,
          [quantity, variantCheck.unit_price, cartId, variant_id]
        );
      }

      await connection.commit();

      res.status(201).json({
        success: true,
        message: "Producto agregado al carrito"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error adding to cart", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  // Actualizar cantidad
  async updateQuantity(req, res) {
    let connection;
    try {
      const userId = req.user.user_id;
      const itemId = req.params.id;
      const { quantity } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: "Cantidad inválida" });
      }

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Verificar que el item pertenece al usuario
      const [item] = await connection.query(
        `SELECT ci.*, i.stock 
         FROM cartitem ci
         JOIN shoppingcart sc ON ci.shoppingCart_FK = sc.shoppingCart_id
         JOIN customer c ON sc.customer_FK = c.customer_id
         JOIN inventory i ON ci.variant_FK = i.variant_FK
         WHERE ci.cartItem_id = ? AND c.user_FK = ?`,
        [itemId, userId]
      );

      if (item.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Item no encontrado" });
      }

      // Validar stock
      if (item[0].stock < quantity) {
        await connection.rollback();
        return res.status(400).json({ 
          error: "Stock insuficiente",
          available: item[0].stock,
          requested: quantity
        });
      }

      await connection.query(
        'UPDATE cartitem SET cartItem_quantity = ? WHERE cartItem_id = ?',
        [quantity, itemId]
      );

      await connection.commit();

      res.json({
        success: true,
        message: "Cantidad actualizada"
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error updating quantity", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  // =============================================
  // MÉTODOS CRUD BASE 
  // =============================================

  async addCartItem(req, res) {
    // Redirigir al método mejorado
    return this.addToCart(req, res);
  }

  async updateCartItem(req, res) {
    // Redirigir al método mejorado
    return this.updateQuantity(req, res);
  }

  async deleteCartItem(req, res) {
    let connection;
    try {
      const userId = req.user.user_id;
      const itemId = req.params.id;

      connection = await connect.getConnection();
      await connection.beginTransaction();

      // Verificar que el item pertenece al usuario
      const [item] = await connection.query(
        `SELECT ci.cartItem_id 
         FROM cartitem ci
         JOIN shoppingcart sc ON ci.shoppingCart_FK = sc.shoppingCart_id
         JOIN customer c ON sc.customer_FK = c.customer_id
         WHERE ci.cartItem_id = ? AND c.user_FK = ?`,
        [itemId, userId]
      );

      if (item.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Item no encontrado" });
      }

      let sqlQuery = "DELETE FROM cartitem WHERE cartItem_id = ?";
      const [result] = await connection.query(sqlQuery, [itemId]);

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Item eliminado del carrito",
        deleted: result.affectedRows
      });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Error deleting CartItem", details: error.message });
    } finally {
      if (connection) connection.release();
    }
  }

  async showCartItem(res) {
    try {
      let sqlQuery = `
        SELECT ci.*, p.product_name, v.size, p.image_url
        FROM cartitem ci
        JOIN productvariants v ON ci.variant_FK = v.variant_id
        JOIN products p ON v.product_FK = p.product_id
      `;
      const [result] = await connect.query(sqlQuery);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching CartItems", details: error.message });
    }
  }

  async showCartItemById(res, req) {
    try {
      const [result] = await connect.query(
        `SELECT ci.*, p.product_name, v.size, p.image_url
         FROM cartitem ci
         JOIN productvariants v ON ci.variant_FK = v.variant_id
         JOIN products p ON v.product_FK = p.product_id
         WHERE ci.cartItem_id = ?`,
        [req.params.id]
      );
      
      if (result.length === 0) return res.status(404).json({ error: "CartItem not found" });
      
      res.status(200).json({
        success: true,
        data: result[0]
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching CartItem", details: error.message });
    }
  }
}

export default CartItemModel;