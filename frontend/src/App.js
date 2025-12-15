import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Importiamo Bootstrap
import './App.css';

import Menubar from './components/Menubar';
import PrivateRoute from './components/PrivateRoute';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import HouseSelection from './pages/HouseSelection';

import authService from './services/auth';


function App() {
  const user = authService.getCurrentUser();
  const hasHouse=authService.hasHouse(); 
  return (
    <BrowserRouter>
      {/* La Menubar sta FUORI dalle Routes così rimane fissa in tutte le pagine */}
      <Menubar />
      
      <div className="container mt-3">
        <Routes>

          <Route 
            path="/" 
            element={
              user 
                ? (hasHouse ? <Navigate to="/dashboard" /> : <Navigate to="/house-selection" />) 
                : <HomePage />
            } 
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route 
             path="/house-selection" 
             element={
               <PrivateRoute>
                 <HouseSelection />
               </PrivateRoute>
             } 
          />

          <Route 
            path="/dashboard" 
            element={
              <HouseRoute>
                <Dashboard />
              </HouseRoute>
            } 
          />

        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;