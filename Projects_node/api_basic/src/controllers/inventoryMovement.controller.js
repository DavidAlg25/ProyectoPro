import InventoryMovementModel from '../models/inventoryMovement.model.js';

export const showInventoryMovement = async (req, res) => {
  try {
    const inventoryMovementModel = new InventoryMovementModel();
    inventoryMovementModel.showInventoryMovement(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching InventoryMovements", details: error.message });
  }
};

export const showInventoryMovementId = async (req, res) => {
  try {
    const inventoryMovementModel = new InventoryMovementModel();
    inventoryMovementModel.showInventoryMovementById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching InventoryMovement", details: error.message });
  }
};

export const addInventoryMovement = async (req, res) => {
  try {
    const inventoryMovementModel = new InventoryMovementModel();
    inventoryMovementModel.addInventoryMovement(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding InventoryMovement", details: error.message });
  }
};

export const updateInventoryMovement = async (req, res) => {
  try {
    const inventoryMovementModel = new InventoryMovementModel();
    inventoryMovementModel.updateInventoryMovement(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating InventoryMovement", details: error.message });
  }
};

export const deleteInventoryMovement = async (req, res) => {
  try {
    const inventoryMovementModel = new InventoryMovementModel();
    inventoryMovementModel.deleteInventoryMovement(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting InventoryMovement", details: error.message });
  }
};


