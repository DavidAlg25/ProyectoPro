import ProductVariantModel from '../models/productVariant.model.js';

export const showProductVariant = async (req, res) => {
  try {
    const productVariantModel = new ProductVariantModel();
    productVariantModel.showProductVariant(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching ProductVariants", details: error.message });
  }
};

export const showProductVariantId = async (req, res) => {
  try {
    const productVariantModel = new ProductVariantModel();
    productVariantModel.showProductVariantById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching ProductVariant", details: error.message });
  }
};

export const addProductVariant = async (req, res) => {
  try {
    const productVariantModel = new ProductVariantModel();
    productVariantModel.addProductVariant(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding ProductVariant", details: error.message });
  }
};

export const updateProductVariant = async (req, res) => {
  try {
    const productVariantModel = new ProductVariantModel();
    productVariantModel.updateProductVariant(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating ProductVariant", details: error.message });
  }
};

export const deleteProductVariant = async (req, res) => {
  try {
    const productVariantModel = new ProductVariantModel();
    productVariantModel.deleteProductVariant(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting ProductVariant", details: error.message });
  }
};


