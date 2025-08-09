import api from "./api.js";

// Obtener todos los items
const getItems = async () => {
  try {
    const response = await api.get("/item/show");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener un item por ID
const getItemById = async (id) => {
  try {
    const response = await api.get(`/item/show/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Crear un nuevo item
const createItem = async (itemData) => {
  try {
    const response = await api.post("/item/create", itemData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Actualizar un item
const updateItem = async (id, itemData) => {
  try {
    const response = await api.put(`/item/update/${id}`, itemData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Eliminar un item
const deleteItem = async (id) => {
  try {
    const response = await api.delete(`/item/delete/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener items por transacción (si existe esta ruta)
const getItemsByTransaction = async (transactionId) => {
  try {
    const response = await api.get(`/item/transaction/${transactionId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getItemsByTransaction,
}; 