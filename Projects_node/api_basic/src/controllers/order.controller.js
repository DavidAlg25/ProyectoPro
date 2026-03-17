import OrderModel from '../models/order.model.js';
import OrderDetailModel from '../models/orderDetail.model.js';
import PaymentModel from '../models/payment.model.js';

// =============================================
// MÉTODOS PARA ÓRDENES (Clientes)
// =============================================

export const createOrderFromCart = async (req, res) => {
  try {
    const orderModel = new OrderModel();
    await orderModel.createOrderFromCart(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error creating order", details: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orderModel = new OrderModel();
    await orderModel.getMyOrders(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching orders", details: error.message });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const orderModel = new OrderModel();
    await orderModel.getOrderDetails(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching order details", details: error.message });
  }
};

export const cancelMyOrder = async (req, res) => {
  try {
    const orderModel = new OrderModel();
    await orderModel.cancelOrder(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error cancelling order", details: error.message });
  }
};

// =============================================
// MÉTODOS PARA PAGOS (Clientes)
// =============================================

export const processPayment = async (req, res) => {
  try {
    const paymentModel = new PaymentModel();
    await paymentModel.processPayment(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error processing payment", details: error.message });
  }
};

export const getMyPayments = async (req, res) => {
  try {
    const paymentModel = new PaymentModel();
    await paymentModel.getMyPayments(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching payments", details: error.message });
  }
};

// =============================================
// MÉTODOS CRUD BASE (para administración)
// =============================================

// Order CRUD
export const showOrder = async (req, res) => {
  try {
    const orderModel = new OrderModel();
    await orderModel.showOrder(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching orders", details: error.message });
  }
};

export const showOrderId = async (req, res) => {
  try {
    const orderModel = new OrderModel();
    await orderModel.showOrderById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching order", details: error.message });
  }
};

export const addOrder = async (req, res) => {
  try {
    const orderModel = new OrderModel();
    await orderModel.addOrder(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding order", details: error.message });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const orderModel = new OrderModel();
    await orderModel.updateOrder(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating order", details: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const orderModel = new OrderModel();
    await orderModel.deleteOrder(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting order", details: error.message });
  }
};

// OrderDetail CRUD
export const showOrderDetail = async (req, res) => {
  try {
    const detailModel = new OrderDetailModel();
    await detailModel.showOrderDetail(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching order details", details: error.message });
  }
};

export const showOrderDetailId = async (req, res) => {
  try {
    const detailModel = new OrderDetailModel();
    await detailModel.showOrderDetailById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching order detail", details: error.message });
  }
};

export const addOrderDetail = async (req, res) => {
  try {
    const detailModel = new OrderDetailModel();
    await detailModel.addOrderDetail(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding order detail", details: error.message });
  }
};

export const updateOrderDetail = async (req, res) => {
  try {
    const detailModel = new OrderDetailModel();
    await detailModel.updateOrderDetail(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating order detail", details: error.message });
  }
};

export const deleteOrderDetail = async (req, res) => {
  try {
    const detailModel = new OrderDetailModel();
    await detailModel.deleteOrderDetail(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting order detail", details: error.message });
  }
};

// Payment CRUD
export const showPayment = async (req, res) => {
  try {
    const paymentModel = new PaymentModel();
    await paymentModel.showPayment(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching payments", details: error.message });
  }
};

export const showPaymentId = async (req, res) => {
  try {
    const paymentModel = new PaymentModel();
    await paymentModel.showPaymentById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching payment", details: error.message });
  }
};

export const addPayment = async (req, res) => {
  try {
    const paymentModel = new PaymentModel();
    await paymentModel.addPayment(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding payment", details: error.message });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const paymentModel = new PaymentModel();
    await paymentModel.updatePayment(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating payment", details: error.message });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const paymentModel = new PaymentModel();
    await paymentModel.deletePayment(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting payment", details: error.message });
  }
};


