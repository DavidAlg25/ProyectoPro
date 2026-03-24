import ShoppingCartModel from '../models/shoppingCart.model.js';
import CartItemModel from '../models/cartItem.model.js';

// =============================================
// MÉTODOS PARA CARRITO
// =============================================

export const getMyCart = async (req, res) => {
  try {
    const cartModel = new ShoppingCartModel();
    await cartModel.getMyCart(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching cart", details: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const cartModel = new ShoppingCartModel();
    await cartModel.clearCart(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error clearing cart", details: error.message });
  }
};

// =============================================
// MÉTODOS PARA ITEMS DEL CARRITO
// =============================================

export const addToCart = async (req, res) => {
  try {
    const cartItemModel = new CartItemModel();
    await cartItemModel.addToCart(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding to cart", details: error.message });
  }
};

export const updateCartItemQuantity = async (req, res) => {
  try {
    const cartItemModel = new CartItemModel();
    await cartItemModel.updateQuantity(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating quantity", details: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const cartItemModel = new CartItemModel();
    await cartItemModel.deleteCartItem(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error removing from cart", details: error.message });
  }
};

// =============================================
// MÉTODOS CRUD BASE (para administración)
// =============================================

// ShoppingCart CRUD 
export const showShoppingCart = async (req, res) => {
  try {
    const cartModel = new ShoppingCartModel();
    await cartModel.showShoppingCart(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching shopping carts", details: error.message });
  }
};

export const showShoppingCartId = async (req, res) => {
  try {
    const cartModel = new ShoppingCartModel();
    await cartModel.showShoppingCartById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching shopping cart", details: error.message });
  }
};

export const addShoppingCart = async (req, res) => {
  try {
    const cartModel = new ShoppingCartModel();
    await cartModel.addShoppingCart(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding shopping cart", details: error.message });
  }
};

export const updateShoppingCart = async (req, res) => {
  try {
    const cartModel = new ShoppingCartModel();
    await cartModel.updateShoppingCart(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating shopping cart", details: error.message });
  }
};

export const deleteShoppingCart = async (req, res) => {
  try {
    const cartModel = new ShoppingCartModel();
    await cartModel.deleteShoppingCart(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting shopping cart", details: error.message });
  }
};

// CartItem CRUD 
export const showCartItem = async (req, res) => {
  try {
    const cartItemModel = new CartItemModel();
    await cartItemModel.showCartItem(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching cart items", details: error.message });
  }
};

export const showCartItemId = async (req, res) => {
  try {
    const cartItemModel = new CartItemModel();
    await cartItemModel.showCartItemById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching cart item", details: error.message });
  }
};