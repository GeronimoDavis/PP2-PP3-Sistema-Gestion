import api from "./api.js";

const loginUser = async (username, password) => {
  const response = await api.post("/user/login", {
    username: username,
    password: password,
  });
  return response.data;
};

const updatePassword = async (username, oldPassword, newPassword) => {
  const response = await api.post("/user/update-pass", {
    username,
    oldPassword,
    newPassword,
  });
  return response.data;
};


export { loginUser, updatePassword };
