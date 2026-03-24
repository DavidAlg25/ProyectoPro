import ProductModel from '../models/product.model.js';

// =============================================
// LISTAR PRODUCTOS (showProduct)
// =============================================
export const showProduct = async (req, res) => {
  try {
    const productModel = new ProductModel();
    
    // Si es cliente, solo mostrar productos activos
    if (req.user && req.user.roles.some(r => r.role_name === 'cliente')) {
      req.query.onlyActive = 'true';
    }
    
    // Usar el método existente getProductsWithVariants
    await productModel.getProductsWithVariants(req, res);
    
  } catch (error) {
    res.status(500).json({ error: "Error fetching Products", details: error.message });
  }
};

// =============================================
// VER PRODUCTO POR ID (showProductId)
// =============================================
export const showProductId = async (req, res) => {
  try {
    const productModel = new ProductModel();
    
    // Pasar el ID como query parameter para reusar getProductsWithVariants
    req.query.productId = req.params.id;
    await productModel.getProductsWithVariants(req, res);
    
  } catch (error) {
    res.status(500).json({ error: "Error fetching Product", details: error.message });
  }
};

// =============================================
// CREAR PRODUCTO (addProduct)
// =============================================
export const addProduct = async (req, res) => {
  try {
    const userRoles = req.user.roles.map(r => r.role_name);
    if (!userRoles.includes('admin')) {
      return res.status(403).json({ 
        error: "Solo administradores pueden crear productos" 
      });
    }
    
    const productModel = new ProductModel();
    await productModel.addProduct(req, res);
    
  } catch (error) {
    res.status(500).json({ error: "Error adding Product", details: error.message });
  }
};

// =============================================
// ACTUALIZAR PRODUCTO (updateProduct)
// =============================================
export const updateProduct = async (req, res) => {
  try {
    const userRoles = req.user.roles.map(r => r.role_name);
    if (!userRoles.includes('admin')) {
      return res.status(403).json({ 
        error: "Solo administradores pueden actualizar productos" 
      });
    }
    
    const productModel = new ProductModel();
    await productModel.updateProduct(req, res);
    
  } catch (error) {
    res.status(500).json({ error: "Error updating Product", details: error.message });
  }
};

// =============================================
// ELIMINAR PRODUCTO (deleteProduct)
// =============================================
export const deleteProduct = async (req, res) => {
  try {
    const userRoles = req.user.roles.map(r => r.role_name);
    if (!userRoles.includes('admin')) {
      return res.status(403).json({ 
        error: "Solo administradores pueden eliminar productos" 
      });
    }
    
    const productModel = new ProductModel();
    await productModel.deleteProduct(req, res);
    
  } catch (error) {
    res.status(500).json({ error: "Error deleting Product", details: error.message });
  }
};

// =============================================
// CAMBIAR ESTADO (toggleProductStatus)
// =============================================
export const toggleProductStatus = async (req, res) => {
  try {
    const userRoles = req.user.roles.map(r => r.role_name);
    if (!userRoles.includes('admin')) {
      return res.status(403).json({ 
        error: "Solo administradores pueden cambiar el estado del producto" 
      });
    }
    
    const productModel = new ProductModel();
    await productModel.toggleStatus(req, res);
    
  } catch (error) {
    res.status(500).json({ error: "Error toggling product status", details: error.message });
  }
};

// =============================================
// CATÁLOGO PÚBLICO (getCatalog)
// =============================================
export const getCatalog = async (req, res) => {
  try {
    const productModel = new ProductModel();
    // Forzar solo productos activos para el catálogo público
    req.query.onlyActive = 'true';
    req.query.includeVariants = 'true';
    await productModel.getProductsWithVariants(req, res);
    
  } catch (error) {
    res.status(500).json({ error: "Error fetching catalog", details: error.message });
  }
};