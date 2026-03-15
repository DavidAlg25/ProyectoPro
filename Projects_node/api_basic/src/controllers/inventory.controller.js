import InventoryModel from '../models/inventory.model.js';

export const showInventory = async (req, res) => {
  try {
    const inventoryModel = new InventoryModel();
    inventoryModel.showInventory(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Inventory", details: error.message });
  }
};

export const showInventoryId = async (req, res) => {
  try {
    const inventoryModel = new InventoryModel();
    inventoryModel.showInventoryById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Inventory", details: error.message });
  }
};

export const addInventory = async (req, res) => {
  try {
    const inventoryModel = new InventoryModel();
    inventoryModel.addInventory(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding Inventory", details: error.message });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const inventoryModel = new InventoryModel();
    inventoryModel.updateInventory(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating Inventory", details: error.message });
  }
};

export const deleteInventory = async (req, res) => {
  try {
    const inventoryModel = new InventoryModel();
    inventoryModel.deleteInventory(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting Inventory", details: error.message });
  }
};


