import api from "./api.js";

const getTransactions = async () => {
  try {
    const response = await api.get("/transaction/show");
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getTransactionById = async (id) => {
  try {
    const response = await api.get(`/transaction/show/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getSalesHistory = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    
    const url = `/transaction/sales?${params.toString()}`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getSaleDetails = async (id) => {
  try {
    const response = await api.get(`/transaction/sales/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const createTransaction = async (transactionData) => {
  try {
    const response = await api.post("/transaction/create", transactionData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const updateTransaction = async (id, transactionData) => {
  try {
    const response = await api.put(
      `/transaction/update/${id}`,
      transactionData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const deleteTransaction = async (id) => {
  try {
    const response = await api.delete(`/transaction/delete/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export {
  getTransactions,
  getTransactionById,
  getSalesHistory,
  getSaleDetails,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
