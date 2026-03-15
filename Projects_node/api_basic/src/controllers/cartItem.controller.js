import CartItemModel from '../models/cartItem.model.js';

export const showCartItem = async (req, res) => {
  try {
    const cartItemModel = new CartItemModel();
    cartItemModel.showCartItem(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching CartItems", details: error.message });
  }
};

export const showCartItemId = async (req, res) => {
  try {
    const cartItemModel = new CartItemModel();
    cartItemModel.showCartItemById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching CartItem", details: error.message });
  }
};

export const addCartItem = async (req, res) => {
  try {
    const cartItemModel = new CartItemModel();
    cartItemModel.addCartItem(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding CartItem", details: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const cartItemModel = new CartItemModel();
    cartItemModel.updateCartItem(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating CartItem", details: error.message });
  }
};

export const deleteCartItem = async (req, res) => {
  try {
    const cartItemModel = new CartItemModel();
    cartItemModel.deleteCartItem(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting CartItem", details: error.message });
  }
};


