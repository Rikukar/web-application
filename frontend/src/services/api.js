import axios from 'axios';

// Axios-instanssi API-kutsuja varten, perus-URL osoittaa backendin /api-päätepisteeseen
const api = axios.create({
  baseURL: '/api',
});

// Lisää JWT-tokenin Authorization-headeriin jokaiseen pyyntöön automaattisesti
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401-virheessä kirjaa käyttäjän ulos automaattisesti (paitsi salasana/tilinpoisto-pyyntö)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthAction = url.includes('/auth/change-password') || url.includes('/auth/delete-account');
      if (!isAuthAction) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
