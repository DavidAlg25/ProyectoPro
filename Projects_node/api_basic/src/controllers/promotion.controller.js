import PromotionModel from '../models/promotion.model.js';

export const showPromotion = async (req, res) => {
  try {
    const promotionModel = new PromotionModel();
    promotionModel.showPromotion(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Promotions", details: error.message });
  }
};

export const showPromotionId = async (req, res) => {
  try {
    const promotionModel = new PromotionModel();
    promotionModel.showPromotionById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Promotion", details: error.message });
  }
};

export const addPromotion = async (req, res) => {
  try {
    const promotionModel = new PromotionModel();
    promotionModel.addPromotion(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding Promotion", details: error.message });
  }
};

export const updatePromotion = async (req, res) => {
  try {
    const promotionModel = new PromotionModel();
    promotionModel.updatePromotion(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating Promotion", details: error.message });
  }
};

export const deletePromotion = async (req, res) => {
  try {
    const promotionModel = new PromotionModel();
    promotionModel.deletePromotion(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting Promotion", details: error.message });
  }
};


