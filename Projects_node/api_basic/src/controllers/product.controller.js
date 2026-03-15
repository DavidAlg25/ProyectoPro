import ProductModel from '../models/product.model.js';

export const showProduct = async (req, res) => {
  try {
    const productModel = new ProductModel();
    productModel.showProduct(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Products", details: error.message });
  }
};

export const showProductId = async (req, res) => {
  try {
    const productModel = new ProductModel();
    productModel.showProductById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Product", details: error.message });
  }
};

export const addProduct = async (req, res) => {
  try {
    const productModel = new ProductModel();
    productModel.addProduct(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding Product", details: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const productModel = new ProductModel();
    productModel.updateProduct(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating Product", details: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const productModel = new ProductModel();
    productModel.deleteProduct(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting Product", details: error.message });
  }
};


