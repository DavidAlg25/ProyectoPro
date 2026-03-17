import InventoryModel from '../models/inventory.model.js';
import InventoryMovementModel from '../models/inventoryMovement.model.js';

// =============================================
// MÉTODOS PARA INVENTARIO (Admin/Bodeguero)
// =============================================

export const getInventoryWithAlerts = async (req, res) => {
  try {
    const inventoryModel = new InventoryModel();
    await inventoryModel.getInventoryWithAlerts(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching inventory alerts", details: error.message });
  }
};

export const restockInventory = async (req, res) => {
  try {
    const inventoryModel = new InventoryModel();
    await inventoryModel.restock(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error restocking inventory", details: error.message });
  }
};

export const getMovementsWithFilters = async (req, res) => {
  try {
    const movementModel = new InventoryMovementModel();
    await movementModel.getMovementsWithFilters(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching movements", details: error.message });
  }
};

// =============================================
// MÉTODOS CRUD BASE (para administración)
// =============================================

// Inventory CRUD
export const showInventory = async (req, res) => {
  try {
    const inventoryModel = new InventoryModel();
    await inventoryModel.showInventory(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching inventory", details: error.message });
  }
};

export const showInventoryId = async (req, res) => {
  try {
    const inventoryModel = new InventoryModel();
    await inventoryModel.showInventoryById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching inventory item", details: error.message });
  }
};

export const addInventory = async (req, res) => {
  try {
    const inventoryModel = new InventoryModel();
    await inventoryModel.addInventory(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding inventory", details: error.message });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const inventoryModel = new InventoryModel();
    await inventoryModel.updateInventory(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating inventory", details: error.message });
  }
};

export const deleteInventory = async (req, res) => {
  try {
    const inventoryModel = new InventoryModel();
    await inventoryModel.deleteInventory(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting inventory", details: error.message });
  }
};

// InventoryMovement CRUD
export const showInventoryMovement = async (req, res) => {
  try {
    const movementModel = new InventoryMovementModel();
    await movementModel.showInventoryMovement(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching inventory movements", details: error.message });
  }
};

export const showInventoryMovementId = async (req, res) => {
  try {
    const movementModel = new InventoryMovementModel();
    await movementModel.showInventoryMovementById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching inventory movement", details: error.message });
  }
};

export const addInventoryMovement = async (req, res) => {
  try {
    const movementModel = new InventoryMovementModel();
    await movementModel.addInventoryMovement(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding inventory movement", details: error.message });
  }
};

export const updateInventoryMovement = async (req, res) => {
  try {
    const movementModel = new InventoryMovementModel();
    await movementModel.updateInventoryMovement(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating inventory movement", details: error.message });
  }
};

export const deleteInventoryMovement = async (req, res) => {
  try {
    const movementModel = new InventoryMovementModel();
    await movementModel.deleteInventoryMovement(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting inventory movement", details: error.message });
  }
};