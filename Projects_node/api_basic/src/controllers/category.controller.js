import CategoryModel from '../models/category.model.js';

// =============================================
// MÉTODOS PÚBLICOS (CUALQUIER ROL PUEDE VER)
// =============================================

export const showCategory = async (req, res) => {
  try {
    const categoryModel = new CategoryModel();
    
    // Si es cliente, solo mostrar categorías con productos activos
    if (req.user && req.user.roles.some(r => r.role_name === 'cliente')) {
      await categoryModel.getActiveCategories(req, res);
    } else {
      await categoryModel.showCategory(res);
    }
  } catch (error) {
    res.status(500).json({ error: "Error fetching Categories", details: error.message });
  }
};

export const showCategoryId = async (req, res) => {
  try {
    const categoryModel = new CategoryModel();
    await categoryModel.showCategoryById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Category", details: error.message });
  }
};

// =============================================
// MÉTODOS SOLO PARA ADMIN (CREAR)
// =============================================

export const addCategory = async (req, res) => {
  try {
    const userRoles = req.user.roles.map(r => r.role_name);
    if (!userRoles.includes('admin')) {
      return res.status(403).json({ 
        error: "Solo administradores pueden crear categorías" 
      });
    }
    
    const categoryModel = new CategoryModel();
    await categoryModel.addCategory(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding Category", details: error.message });
  }
};

// =============================================
// MÉTODOS SOLO PARA ADMIN (ACTUALIZAR)
// =============================================

export const updateCategory = async (req, res) => {
  try {
    const userRoles = req.user.roles.map(r => r.role_name);
    if (!userRoles.includes('admin')) {
      return res.status(403).json({ 
        error: "Solo administradores pueden actualizar categorías" 
      });
    }
    
    const categoryModel = new CategoryModel();
    await categoryModel.updateCategory(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating Category", details: error.message });
  }
};

// =============================================
// MÉTODOS SOLO PARA ADMIN (ELIMINAR)
// =============================================

export const deleteCategory = async (req, res) => {
  try {
    const userRoles = req.user.roles.map(r => r.role_name);
    if (!userRoles.includes('admin')) {
      return res.status(403).json({ 
        error: "Solo administradores pueden eliminar categorías" 
      });
    }
    
    const categoryModel = new CategoryModel();
    await categoryModel.deleteCategory(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting Category", details: error.message });
  }
};

// =============================================
// MÉTODOS PÚBLICOS: Productos por categoría
// =============================================

export const getProductsByCategory = async (req, res) => {
  try {
    const categoryModel = new CategoryModel();
    
    // Si es cliente, solo productos activos
    if (req.user && req.user.roles.some(r => r.role_name === 'cliente')) {
      req.query.onlyActive = 'true';
    }
    
    await categoryModel.getProductsByCategory(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching products by category", details: error.message });
  }
};

// =============================================
// MÉTODO PÚBLICO: Categorías activas (sin autenticar)
// =============================================

export const getActiveCategories = async (req, res) => {
  try {
    const categoryModel = new CategoryModel();
    await categoryModel.getActiveCategories(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching active categories", details: error.message });
  }
};