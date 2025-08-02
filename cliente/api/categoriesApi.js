import api from "./api.js";

const getCategories = async () => {
  try {
    const response = await api.get("/category/show");
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getCategoryById = async (id) => {
  try {
    const response = await api.get(`/category/show/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const createCategory = async (categoryData) => {
  try {
    const response = await api.post("/category/create", categoryData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const updateCategory = async (id, categoryData) => {
  try {
    const response = await api.put(`/category/update/${id}`, categoryData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export { getCategories, getCategoryById, createCategory, updateCategory };
