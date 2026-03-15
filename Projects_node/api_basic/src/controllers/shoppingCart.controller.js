import ShoppingCartModel from '../models/shoppingCart.model.js';

export const showShoppingCart = async (req, res) => {
  try {
    const shoppingCartModel = new ShoppingCartModel();
    shoppingCartModel.showShoppingCart(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching ShoppingCarts", details: error.message });
  }
};

export const showShoppingCartId = async (req, res) => {
  try {
    const shoppingCartModel = new ShoppingCartModel();
    shoppingCartModel.showShoppingCartById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching ShoppingCart", details: error.message });
  }
};

export const addShoppingCart = async (req, res) => {
  try {
    const shoppingCartModel = new ShoppingCartModel();
    shoppingCartModel.addShoppingCart(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding ShoppingCart", details: error.message });
  }
};

export const updateShoppingCart = async (req, res) => {
  try {
    const shoppingCartModel = new ShoppingCartModel();
    shoppingCartModel.updateShoppingCart(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating ShoppingCart", details: error.message });
  }
};

export const deleteShoppingCart = async (req, res) => {
  try {
    const shoppingCartModel = new ShoppingCartModel();
    shoppingCartModel.deleteShoppingCart(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting ShoppingCart", details: error.message });
  }
};


