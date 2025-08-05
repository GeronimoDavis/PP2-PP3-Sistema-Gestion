import api from "./api.js";
//este es el que se encarga de obtener todos los productos
const getProducts = async () => {
  try {
    const response = await api.get("/product/show");
    return response.data;
  } catch (error) {
    throw error;
  }
};
//este es el que se encarga de obtener un producto por su id
const getProductById = async (id) => {
  try {
    const response = await api.get(`/product/show/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
//este es el que se encarga de crear un nuevo producto
const createProduct = async (productData) => {
  try {
    const response = await api.post("/product/create", productData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
//este es el que se encarga de actualizar un producto
const updateProduct = async (id, productData) => {
  try {
    const response = await api.put(`/product/update/${id}`, productData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
//este es el que se encarga de eliminar un producto
const deleteProduct = async (id) => {
  try {
    const response = await api.delete(`/product/delete/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
//este es el que se encarga de obtener un producto por su codigo
const getProductByCode = async (code) => {
  try {
    const response = await api.get(`/product/code/${code}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
//este es el que se encarga de obtener un producto por su nombre
const getProductByName = async (name) => {
  try {
    const response = await api.get(`/product/name/${name}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
//este es el que se encarga de obtener un producto por su categoria
const getProductByCategory = async (categoryId) => {
  try {
    const response = await api.get(`/product/category/${categoryId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
//este es el que se encarga de obtener un producto por su stock
const getProductByStock = async (stock) => {
  try {
    const response = await api.get(`/product/stock/${stock}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
//este es el que se encarga de obtener un producto por su precio
const getProductByPrice = async (price) => {
  try {
    const response = await api.get(`/product/purchasePrice/${price}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
//este es el que se encarga de obtener un producto por su rango de precio
const getProductByPriceRange = async (min, max) => {
  try {
    const response = await api.get(`/product/priceRange/${min}/${max}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getProductByStockRange = async (min, max) => {
  try {
    const response = await api.get(`/product/stockRange/${min}/${max}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
//este es el que se encarga de actualizar el estado de un producto
const updateProductStatus = async (id) => {
  try {
    const response = await api.put(`/product/updateStatus/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
//este es el que se encarga de obtener un producto por su estado
const getProductByStatus = async (status) => {
  try {
    const response = await api.get(`/product/status/${status}`);
    return response.data;
  } catch (error) {
    throw error;
  } 
};

//exportamos las funciones
export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductByCode,
  getProductByName,
  getProductByCategory,
  getProductByStock,
  getProductByPrice,
  getProductByPriceRange,
  getProductByStockRange,
  updateProductStatus, 
  getProductByStatus
  
};
