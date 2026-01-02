import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Importiamo Bootstrap
import './App.css';

import Menubar from './components/Menubar';
import PrivateRoute from './components/PrivateRoute';
import ClickSpark from './components/ClickSpark';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import HouseSelection from './pages/HouseSelection';
import TaskMarket from './pages/TaskPage/TaskMarket';
import authService from './services/auth';
import ProfilePage from './pages/ProfilePage/ProfilePage';


function App() {
  const user = authService.getCurrentUser();
  const hasHouse=authService.hasHouse(); 
  
  return (
    <BrowserRouter>
     
      <ClickSpark
  sparkColor='#000000ff'
  sparkSize={10}
  sparkRadius={15}
  sparkCount={8}
  duration={400}
>

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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/house-selection" element={<HouseSelection />} />
          <Route path="/task-market" element={<TaskMarket />} />

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
              <PrivateRoute requiresHouse={true}>
                <Dashboard />
              </PrivateRoute>
            } 
          />

{/* vavigate login impedisce a persone non registrate di accedere alle missioni */}
          <Route 
          path="/task-market"
          element={user ? <TaskMarket /> : <Navigate to= '/login' />}
          />

          <Route 
          path="/profile" 
          element={user ? <ProfilePage /> : <Navigate to="/login" />} 
          />

        </Routes>
      </div>
      </ClickSpark>
    </BrowserRouter>
  );
}
export default App;