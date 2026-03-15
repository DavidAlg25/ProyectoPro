import OrderModel from '../models/order.model.js';

export const showOrder = async (req, res) => {
  try {
    const orderModel = new OrderModel();
    orderModel.showOrder(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Orders", details: error.message });
  }
};

export const showOrderId = async (req, res) => {
  try {
    const orderModel = new OrderModel();
    orderModel.showOrderById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Order", details: error.message });
  }
};

export const addOrder = async (req, res) => {
  try {
    const orderModel = new OrderModel();
    orderModel.addOrder(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding Order", details: error.message });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const orderModel = new OrderModel();
    orderModel.updateOrder(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating Order", details: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const orderModel = new OrderModel();
    orderModel.deleteOrder(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting Order", details: error.message });
  }
};


