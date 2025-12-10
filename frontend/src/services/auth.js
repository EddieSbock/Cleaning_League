import api from './api';

const login = async (username, password) => {
    //il backend deve fornire una "chiave" quando si entra 
  const response = await api.post('token/', { 
    username,
    password
  });
  
  if (response.data.access) {
    //il token veine salvato nel "magazzino" del browser
    localStorage.setItem('userToken', response.data.access);
    // salviamo anche l'utente se il backend ce lo manda
    localStorage.setItem('username', username);
  }
  return response.data;
};

const register = async (username, email, password) => {
  const response = await api.post('register/', {
    username,
    email,
    password
  });
  return response.data;
};


const logout = () => {
  localStorage.removeItem('userToken');
  localStorage.removeItem('username');
};

// funzione che verifica se l'utente è già registrato.
const getCurrentUser = () => {
  return localStorage.getItem('userToken');
};

const authService = {
  login,
  register,
  logout,
  getCurrentUser
};

export default authService;

