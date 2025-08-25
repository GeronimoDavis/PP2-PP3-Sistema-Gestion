import api from "./api.js";

const getTotalSales = async () => {
  try {
    const response = await api.get("/dashboard/total-sales");
    return response.data;
  } catch (error) {
    throw error;
  }
};
const getRecentTransactions = async () => {
  try {
    const response = await api.get("/dashboard/recent-transactions");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export { getTotalSales, getRecentTransactions };