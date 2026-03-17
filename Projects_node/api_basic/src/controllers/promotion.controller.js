import PromotionModel from '../models/promotion.model.js';
import ProductPromotionModel from '../models/productPromotion.model.js';

// =============================================
// MÉTODOS PARA PROMOCIONES
// =============================================

export const getActivePromotions = async (req, res) => {
  try {
    const promotionModel = new PromotionModel();
    await promotionModel.getActivePromotions(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching active promotions", details: error.message });
  }
};

export const getPromotionsWithStats = async (req, res) => {
  try {
    const promotionModel = new PromotionModel();
    await promotionModel.getPromotionsWithStats(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching promotions stats", details: error.message });
  }
};

// =============================================
// MÉTODOS PARA ASIGNACIONES
// =============================================

export const bulkAssignPromotions = async (req, res) => {
  try {
    const assignmentModel = new ProductPromotionModel();
    await assignmentModel.bulkAssign(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error in bulk assignment", details: error.message });
  }
};

export const getVariantPromotions = async (req, res) => {
  try {
    const { variantId } = req.params;
    const assignmentModel = new ProductPromotionModel();
    const promotions = await assignmentModel.getVariantPromotions(variantId);
    
    // Calcular precio con descuento
    const [variant] = await connect.query(
      'SELECT unit_price FROM productvariants WHERE variant_id = ?',
      [variantId]
    );

    const result = promotions.map(p => ({
      ...p,
      discounted_price: assignmentModel.calculateDiscountedPrice(
        variant[0]?.unit_price || 0, 
        p.promotion_discount
      )
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching variant promotions", details: error.message });
  }
};

// =============================================
// MÉTODOS CRUD BASE
// =============================================

// Promotion CRUD
export const showPromotion = async (req, res) => {
  try {
    const promotionModel = new PromotionModel();
    await promotionModel.showPromotion(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching promotions", details: error.message });
  }
};

export const showPromotionId = async (req, res) => {
  try {
    const promotionModel = new PromotionModel();
    await promotionModel.showPromotionById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching promotion", details: error.message });
  }
};

export const addPromotion = async (req, res) => {
  try {
    const promotionModel = new PromotionModel();
    await promotionModel.addPromotion(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding promotion", details: error.message });
  }
};

export const updatePromotion = async (req, res) => {
  try {
    const promotionModel = new PromotionModel();
    await promotionModel.updatePromotion(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating promotion", details: error.message });
  }
};

export const deletePromotion = async (req, res) => {
  try {
    const promotionModel = new PromotionModel();
    await promotionModel.deletePromotion(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting promotion", details: error.message });
  }
};

// ProductPromotion CRUD
export const showProductPromotion = async (req, res) => {
  try {
    const assignmentModel = new ProductPromotionModel();
    await assignmentModel.showProductPromotion(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching assignments", details: error.message });
  }
};

export const showProductPromotionId = async (req, res) => {
  try {
    const assignmentModel = new ProductPromotionModel();
    await assignmentModel.showProductPromotionById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching assignment", details: error.message });
  }
};

export const addProductPromotion = async (req, res) => {
  try {
    const assignmentModel = new ProductPromotionModel();
    await assignmentModel.addProductPromotion(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding assignment", details: error.message });
  }
};

export const updateProductPromotion = async (req, res) => {
  try {
    const assignmentModel = new ProductPromotionModel();
    await assignmentModel.updateProductPromotion(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating assignment", details: error.message });
  }
};

export const deleteProductPromotion = async (req, res) => {
  try {
    const assignmentModel = new ProductPromotionModel();
    await assignmentModel.deleteProductPromotion(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting assignment", details: error.message });
  }
};