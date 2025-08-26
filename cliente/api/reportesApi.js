import api from "./api.js";

const getSalesOverview = async (startDate, endDate) => {
  try {
    const response = await api.get(
      `/reports/sales-overview?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getSalesByCategory = async (startDate, endDate) => {
  try {
    const response = await api.get(
      `/reports/sales-by-category?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getTopSellingProducts = async (startDate, endDate) => {
  try {
    const response = await api.get(
      `/reports/top-selling-products?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getSalesTrendsByCategory = async (startDate, endDate, interval) => {
  try {
    const response = await api.get(
      `/reports/sales-trends-by-category?startDate=${startDate}&endDate=${endDate}&interval=${interval}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export {
  getSalesOverview,
  getSalesByCategory,
  getTopSellingProducts,
  getSalesTrendsByCategory,
};
