import axios from 'axios'; // Farà da "ponte" con il backend

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/', // Indirizzo Django
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

export default api;