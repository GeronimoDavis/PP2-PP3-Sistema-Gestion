import api from "./api.js";

const loginUser = async (username, password) => {
  const response = await api.post("/user/login", {
    username: username,
    password: password,
  });
  return response.data;
};

export { loginUser };
