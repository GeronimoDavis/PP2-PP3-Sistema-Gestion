import api from "./api.js";

const getTotalSales = async () => {
  try {
    const response = await api.get("/dashboard/totalSales");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export { getTotalSales };