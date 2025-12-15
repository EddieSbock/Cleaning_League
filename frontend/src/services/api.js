import axios from 'axios'; // Farà da "ponte" con il backend

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/', // Indirizzo Django
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

api.interceptors.request.use( //è fondamentale, senza di questo si verificano errori per l'accesso.
  (config) => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

