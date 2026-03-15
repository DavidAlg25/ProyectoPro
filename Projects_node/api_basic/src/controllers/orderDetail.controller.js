import OrderDetailModel from '../models/orderDetail.model.js';

export const showOrderDetail = async (req, res) => {
  try {
    const orderDetailModel = new OrderDetailModel();
    orderDetailModel.showOrderDetail(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching OrderDetails", details: error.message });
  }
};

export const showOrderDetailId = async (req, res) => {
  try {
    const orderDetailModel = new OrderDetailModel();
    orderDetailModel.showOrderDetailById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching OrderDetail", details: error.message });
  }
};

export const addOrderDetail = async (req, res) => {
  try {
    const orderDetailModel = new OrderDetailModel();
    orderDetailModel.addOrderDetail(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding OrderDetail", details: error.message });
  }
};

export const updateOrderDetail = async (req, res) => {
  try {
    const orderDetailModel = new OrderDetailModel();
    orderDetailModel.updateOrderDetail(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating OrderDetail", details: error.message });
  }
};

export const deleteOrderDetail = async (req, res) => {
  try {
    const orderDetailModel = new OrderDetailModel();
    orderDetailModel.deleteOrderDetail(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting OrderDetail", details: error.message });
  }
};


