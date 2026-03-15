import PaymentModel from '../models/payment.model.js';

export const showPayment = async (req, res) => {
  try {
    const paymentModel = new PaymentModel();
    paymentModel.showPayment(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Payments", details: error.message });
  }
};

export const showPaymentId = async (req, res) => {
  try {
    const paymentModel = new PaymentModel();
    paymentModel.showPaymentById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Payment", details: error.message });
  }
};

export const addPayment = async (req, res) => {
  try {
    const paymentModel = new PaymentModel();
    paymentModel.addPayment(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding Payment", details: error.message });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const paymentModel = new PaymentModel();
    paymentModel.updatePayment(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating Payment", details: error.message });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const paymentModel = new PaymentModel();
    paymentModel.deletePayment(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting Payment", details: error.message });
  }
};


