import api from "./api.js";

const getTotalSales = async (from, to) => {
  try {
    const response = await api.get("/dashboard/total-sales", {
      params: { from, to },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
const getRecentTransactions = async (from, to) => {
  try {
    const response = await api.get("/dashboard/recent-transactions/10", {
      params: { from, to },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getProductsWithoutStock = async () => {
  try {
    const response = await api.get("/dashboard/withoutStock");
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getSalesWithPendingBalance = async (from, to) => {
  try {
    const response = await api.get("/dashboard/sales-with-pending-balance", {
      params: { from, to },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getTotalPurchases = async (from, to) => {
  try {
    const response = await api.get("/dashboard/total-purchases", {
      params: { from, to },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getSalesSummary = async (from, to) => {
  try {
    const response = await api.get("/dashboard/sales-summary", {
      params: { from, to },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export {
  getTotalSales,
  getRecentTransactions,
  getProductsWithoutStock,
  getSalesWithPendingBalance,
  getTotalPurchases,
  getSalesSummary,
};
