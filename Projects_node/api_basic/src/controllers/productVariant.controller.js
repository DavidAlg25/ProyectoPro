import ProductVariantModel from '../models/productVariant.model.js';

// =============================================
// MÉTODOS PÚBLICOS (CUALQUIER ROL PUEDE VER)
// =============================================

export const showProductVariant = async (req, res) => {
  try {
    const variantModel = new ProductVariantModel();
    
    // Si es cliente, solo mostrar variantes activas
    if (req.user && req.user.roles.some(r => r.role_name === 'cliente')) {
      req.query.onlyActive = 'true';
    }
    
    await variantModel.showProductVariant(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Product Variants", details: error.message });
  }
};

export const showProductVariantId = async (req, res) => {
  try {
    const variantModel = new ProductVariantModel();
    await variantModel.showProductVariantById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Product Variant", details: error.message });
  }
};

// =============================================
// MÉTODOS SOLO PARA ADMIN (CREAR)
// =============================================

export const addProductVariant = async (req, res) => {
  try {
    // Verificación adicional en el controlador (por si acaso)
    const userRoles = req.user.roles.map(r => r.role_name);
    if (!userRoles.includes('admin')) {
      return res.status(403).json({ 
        error: "Solo administradores pueden crear variantes" 
      });
    }
    
    const variantModel = new ProductVariantModel();
    await variantModel.addProductVariant(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding Product Variant", details: error.message });
  }
};

// =============================================
// MÉTODOS SOLO PARA ADMIN (ACTUALIZAR)
// =============================================

export const updateProductVariant = async (req, res) => {
  try {
    const userRoles = req.user.roles.map(r => r.role_name);
    if (!userRoles.includes('admin')) {
      return res.status(403).json({ 
        error: "Solo administradores pueden actualizar variantes" 
      });
    }
    
    const variantModel = new ProductVariantModel();
    await variantModel.updateProductVariant(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating Product Variant", details: error.message });
  }
};

// =============================================
// MÉTODOS SOLO PARA ADMIN (ELIMINAR)
// =============================================

export const deleteProductVariant = async (req, res) => {
  try {
    const userRoles = req.user.roles.map(r => r.role_name);
    if (!userRoles.includes('admin')) {
      return res.status(403).json({ 
        error: "Solo administradores pueden eliminar variantes" 
      });
    }
    
    const variantModel = new ProductVariantModel();
    await variantModel.deleteProductVariant(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting Product Variant", details: error.message });
  }
};

// =============================================
// MÉTODOS PARA BODEGUERO (VER STOCK)
// =============================================

export const getVariantsByProduct = async (req, res) => {
  try {
    const variantModel = new ProductVariantModel();
    
    // Si es bodeguero, incluir información de stock
    if (req.user && req.user.roles.some(r => r.role_name === 'bodeguero')) {
      req.query.includeStock = 'true';
    }
    
    await variantModel.getVariantsByProduct(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching variants by product", details: error.message });
  }
};

// =============================================
// MÉTODO PÚBLICO PARA CLIENTES (VER DISPONIBILIDAD)
// =============================================

export const checkVariantAvailability = async (req, res) => {
  try {
    const variantModel = new ProductVariantModel();
    await variantModel.checkAvailability(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error checking availability", details: error.message });
  }
};