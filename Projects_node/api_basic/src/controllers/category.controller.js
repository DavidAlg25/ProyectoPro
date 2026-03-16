import CategoryModel from '../models/category.model.js';

export const showCategory = async (req, res) => {
  try {
    const categoryModel = new CategoryModel();
    categoryModel.showCategory(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Categorys", details: error.message });
  }
};

export const showCategoryId = async (req, res) => {
  try {
    const categoryModel = new CategoryModel();
    categoryModel.showCategoryById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Category", details: error.message });
  }
};

export const addCategory = async (req, res) => {
  try {
    const categoryModel = new CategoryModel();
    categoryModel.addCategory(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding Category", details: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const categoryModel = new CategoryModel();
    categoryModel.updateCategory(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating Category", details: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const categoryModel = new CategoryModel();
    categoryModel.deleteCategory(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting Category", details: error.message });
  }
};


