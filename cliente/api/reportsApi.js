import api from "./api";

const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

export const getSalesByPeriod = async (from, to, period) => {
  const fromDate = formatDate(from);
  const toDate = formatDate(to);
  try {
    const response = await api.get(
      `/reports/sales-by-period?from=${fromDate}&to=${toDate}&period=${period}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching sales by period:", error);
    throw error;
  }
};

export const getSalesByCategory = async (from, to) => {
  const fromDate = formatDate(from);
  const toDate = formatDate(to);
  try {
    const response = await api.get(
      `/reports/sales-by-category?from=${fromDate}&to=${toDate}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching sales by category:", error);
    throw error;
  }
};

export const getTopSellingProducts = async (from, to) => {
  const fromDate = formatDate(from);
  const toDate = formatDate(to);
  try {
    const response = await api.get(
      `/reports/top-selling-products?from=${fromDate}&to=${toDate}&limit=5`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching top selling products:", error);
    throw error;
  }
};

export const getSalesTrendsByCategory = async (from, to) => {
  const fromDate = formatDate(from);
  const toDate = formatDate(to);
  try {
    const response = await api.get(
      `/reports/sales-trends-by-category?from=${fromDate}&to=${toDate}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching sales trends:", error);
    throw error;
  }
};

