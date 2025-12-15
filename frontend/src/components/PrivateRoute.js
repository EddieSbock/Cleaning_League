import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/auth';

const ProtectedRoute = ({ requiresHouse=false, protectedComponent}) => {
  const user = authService.getCurrentUser(); //controlla se ha il token
  const hasHouse = authService.hasHouse(); 


  if (!user) {
    return <Navigate to="/register" />;
  }

  if (requiresHouse && !hasHouse) {
    //in caso non abbia una "casa" si va alla schermata di selezione e creazione.
    return <Navigate to="/house-selection" />;
  }


  //accesso libero a tutti gli utenti già registrati
  return protectedComponent;
};

export default PrivateRoute;