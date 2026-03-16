import CustomerModel from '../models/customer.model.js';

export const showCustomer = async (req, res) => {
  try {
    const customerModel = new CustomerModel();
    customerModel.showCustomer(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Customer", details: error.message });
  }
};

export const showCustomerId = async (req, res) => {
  try {
    const customerModel = new CustomerModel();
    customerModel.showCustomerById(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Customer", details: error.message });
  }
};

export const addCustomer = async (req, res) => {
  try {
    const customerModel = new CustomerModel();
    customerModel.addCustomer(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding Customer", details: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const customerModel = new CustomerModel();
    customerModel.updateCustomer(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating Customer", details: error.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const customerModel = new CustomerModel();
    customerModel.deleteCustomer(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting Customer", details: error.message });
  }
};


