import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/auth';

function Menubar() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser(); // Recupera il token

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login'; // Usa href per pulire tutto
  };

  return (
    <nav className="navbar navbar-dark px-3 mb-4" style={{ background: 'linear-gradient(to right, #4e54c8, #8f94fb)' }}>
      <Link className="navbar-brand fw-bold" to="/">🏠 Cleaning League</Link>
      
      <div>
        {user ? (
          <button onClick={handleLogout} className="btn btn-light btn-sm fw-bold text-primary">
            Esci
          </button>
        ) : (
          <div className="d-flex gap-2">
            <Link to="/login" className="btn btn-outline-light btn-sm">Accedi</Link>
            <Link to="/register" className="btn btn-light btn-sm text-primary fw-bold">Registrati</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Menubar;