import api from "./api.js";

const getPayments = async () => {
  try {
    const response = await api.get("/payments/show");
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getPaymentById = async (id) => {
  try {
    const response = await api.get(`/payments/show/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const createPayment = async (paymentData) => {
  try {
    const response = await api.post("/payments/create", paymentData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const updatePayment = async (id, paymentData) => {
  try {
    const response = await api.put(`/payments/update/${id}`, paymentData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const deletePayment = async (id) => {
  try {
    const response = await api.delete(`/payments/delete/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getPaymentsByTransactionId = async (transactionId) => {
  try {
    const response = await api.get(`/payments/transaction/${transactionId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getPaymentsByType = async (type) => {
  try {
    const response = await api.get(`/payments/type/${type}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getPaymentsByDate = async (date) => {
  try {
    const response = await api.get(`/payments/date/${date}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentsByTransactionId,
  getPaymentsByType,
  getPaymentsByDate,
};
