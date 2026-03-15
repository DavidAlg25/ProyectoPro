import ProductPromotionModel from '../models/productPromotion.model.js';

export const showProductPromotion = async (req, res) => {
  try {
    const productPromotionModel = new ProductPromotionModel();
    productPromotionModel.showProductPromotion(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching ProductPromotions", details: error.message });
  }
};

export const showProductPromotionId = async (req, res) => {
  try {
    const productPromotionModel = new ProductPromotionModel();
    productPromotionModel.showProductPromotionById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching ProductPromotion", details: error.message });
  }
};

export const addProductPromotion = async (req, res) => {
  try {
    const productPromotionModel = new ProductPromotionModel();
    productPromotionModel.addProductPromotion(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding ProductPromotion", details: error.message });
  }
};

export const updateProductPromotion = async (req, res) => {
  try {
    const productPromotionModel = new ProductPromotionModel();
    productPromotionModel.updateProductPromotion(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating ProductPromotion", details: error.message });
  }
};

export const deleteProductPromotion = async (req, res) => {
  try {
    const productPromotionModel = new ProductPromotionModel();
    productPromotionModel.deleteProductPromotion(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting ProductPromotion", details: error.message });
  }
};


