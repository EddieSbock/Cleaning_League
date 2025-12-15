import api from './api';

const login = async (username, password) => {
    //il backend deve fornire una "chiave" quando si entra 
  const response = await api.post('token/', { username, password});

  
  if (response.data.access) {
    //il token veine salvato nel "magazzino" del browser
    localStorage.setItem('userToken', response.data.access);
    // salviamo anche l'utente se il backend ce lo manda
    localStorage.setItem('username', username);

    const houseId=response.data.house_id;
    if (response.data.house_id) {
      localStorage.setItem('houseId', houseId);
    } else {
      localStorage.removeItem('houseId'); 
    }
  }
  return response.data;
};

// Il controllore verifica se ha casa
const hasHouse = () => {
  const houseId = localStorage.getItem('houseId');
  // Restituisce true solo se houseId esiste ed è valido
  return houseId && houseId !== 'null' && houseId !== 'undefined';
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
  localStorage.removeItem('houseId');
};

// funzione che verifica se l'utente è già registrato.
const getCurrentUser = () => {
  return localStorage.getItem('userToken');
};

const authService = {
  login,
  hasHouse,
  register,
  logout,
  getCurrentUser
};

export default authService;

