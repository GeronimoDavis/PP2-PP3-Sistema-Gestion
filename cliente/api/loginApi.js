import api from "./api.js";

const loginUser = async (username, password) => {
  try {
    const response = await api.post("/user/login", {
      username: username,
      password: password,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export { loginUser };
