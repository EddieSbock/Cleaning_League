import React from 'react';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate,useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Importiamo Bootstrap
import './App.css';

import Menubar from './components/Menubar';
import PrivateRoute from './components/PrivateRoute';
import ClickSpark from './components/ClickSpark';
import Background from './components/Background';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import HouseSelection from './pages/HouseSelection';
import TaskMarket from './pages/TaskPage/TaskMarket';
import authService from './services/auth';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import AdminPage from './pages/AdminPage/AdminPage';

import api from './services/api';


const AppContent = () => {
  const location = useLocation();
  const [user, setUser] = useState(authService.getCurrentUser());
  const [hasHouse, setHasHouse] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    if (!currentUser) {
      setIsChecking(false);
    }
  }, [location]);

  useEffect(() => {
   const checkHouseStatus = async () => {
     
      if (!user) {
        setIsChecking(false);
        return;
      }

     
      setIsChecking(true);

      try {
        console.log("Controllo casa in corso...");
        const response = await api.get('profiles/');
        const myProfile = response.data[0];

        console.log("Profilo ricevuto dal server:", myProfile);

        if (myProfile && myProfile.house) {
          console.log("Casa trovata! ID:", myProfile.house);
          setHasHouse(true);
          
     
          const storedUser = JSON.parse(localStorage.getItem('user'));
          if (storedUser) {
             storedUser.house = myProfile.house; 
             localStorage.setItem('user', JSON.stringify(storedUser));
          }
        } else {
          console.warn("Nessuna casa trovata nel profilo.");
          setHasHouse(false);
        }

      } catch (error) {
        console.error("Errore controllo casa:", error);
        setHasHouse(false);
        
        // Se il token è scaduto
        if (error.response && error.response.status === 401) {
            authService.logout();
            setUser(null);
        }
      } finally {
      
        console.log("Controllo finito. Sblocco interfaccia.");
        setIsChecking(false);
      }
    };

    checkHouseStatus();
  }, [user]);

  if (user && isChecking) {
    return (
      <div style={{ background: '#1a1a2e', height: '100vh', display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
          <h2>Caricamento Profilo...</h2>
          <p>Verifica abitazione in corso...</p>
      </div>
    );
  }

  return (

      <ClickSpark
        sparkColor='#eac66eff'
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
          <Background />
        </div>
        <div style={{ position: 'relative', zIndex: 10 }}>

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
                  <PrivateRoute requiresHouse={false}>
                    {hasHouse ? <Navigate to="/dashboard" /> : <HouseSelection />}
                  </PrivateRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    {hasHouse ? <Dashboard /> : <Navigate to="/house-selection" />}
                  </PrivateRoute>
                }
              />

              {/* navigate login impedisce a persone non registrate di accedere alle missioni */}
              <Route
                path="/task-market"
                element={user ? <TaskMarket /> : <Navigate to='/login' />}
              />

              <Route
                path="/profile"
                element={user ? <ProfilePage /> : <Navigate to="/login" />}
              />

              <Route
                path="/admin"
                element={<AdminPage />}
              />

            </Routes>
          </div>
        </div>
      </ClickSpark>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;