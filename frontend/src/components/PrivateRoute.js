import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/auth';

const PrivateRoute = ({ children }) => {
  const user = authService.getCurrentUser(); //controlla se ha il token

  if (!user) {
    return <Navigate to="/login" />;
  }

  //accesso libero a tutti gli utenti già registrati
  return children;
};

export default PrivateRoute;