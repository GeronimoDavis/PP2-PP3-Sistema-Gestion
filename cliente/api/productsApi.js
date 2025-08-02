import api from "./api.js";

const getProducts = async () => {
  try {
    const response = await api.get("/product/show");
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getProductById = async (id) => {
  try {
    const response = await api.get(`/product/show/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const createProduct = async (productData) => {
  try {
    const response = await api.post("/product/create", productData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const updateProduct = async (id, productData) => {
  try {
    const response = await api.put(`/product/update/${id}`, productData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const deleteProduct = async (id) => {
  try {
    const response = await api.delete(`/product/delete/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getProductByCode = async (code) => {
  try {
    const response = await api.get(`/product/code/${code}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getProductByDescription = async (description) => {
  try {
    const response = await api.get(`/product/description/${description}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getProductByCategory = async (categoryId) => {
  try {
    const response = await api.get(`/product/category/${categoryId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getProductByStock = async (stock) => {
  try {
    const response = await api.get(`/product/stock/${stock}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getProductByPrice = async (price) => {
  try {
    const response = await api.get(`/product/purchasePrice/${price}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

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

export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductByCode,
  getProductByDescription,
  getProductByCategory,
  getProductByStock,
  getProductByPrice,
  getProductByPriceRange,
  getProductByStockRange,
};
