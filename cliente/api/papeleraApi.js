import api from "./api.js";

// Productos eliminados
const getDeletedProducts = async () => {
  try {
    const response = await api.get("/product/deleted");
    return response.data;
  } catch (error) {
    throw error;
  }
};

const restoreProduct = async (id) => {
  try {
    const response = await api.put(`/product/restore/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Personas eliminadas
const getDeletedPersons = async () => {
  try {
    const response = await api.get("/person/deleted");
    return response.data;
  } catch (error) {
    throw error;
  }
};

const restorePerson = async (id) => {
  try {
    const response = await api.put(`/person/restore/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export { getDeletedProducts, getDeletedPersons, restoreProduct, restorePerson };
