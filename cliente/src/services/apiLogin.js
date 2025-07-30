import axios from 'axios';

const API_BASE_URL = 'https://cheats-finnish-inflation-protecting.trycloudflare.com';

const apiLogin = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a todas las peticiones
apiLogin.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Función para login de usuario
export const loginUser = async (username, password) => {
  try {
    const response = await apiLogin.post('/user/login', {
      username: username,
      password: password
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default apiLogin;
