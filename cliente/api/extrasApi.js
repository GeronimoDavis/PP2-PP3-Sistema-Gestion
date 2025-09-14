import api from "./api.js";

const createExtra = async (extraData) => {
  try {
    const response = await api.post("/extras/create", extraData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getExtrasByTransaction = async (transactionId) => {
  try {
    const response = await api.get(`/extras/transaction/${transactionId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const updateExtra = async (id, extraData) => {
  try {
    const response = await api.put(`/extras/update/${id}`, extraData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const deleteExtra = async (id) => {
  try {
    const response = await api.delete(`/extras/delete/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export {
  createExtra,
  getExtrasByTransaction,
  updateExtra,
  deleteExtra,
};
