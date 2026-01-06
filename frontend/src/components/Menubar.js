import React from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/auth';
import api from '../services/api';
import logoImg from '../assets/Logo CL rosso grande.png';

function Menubar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(authService.getCurrentUser());
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, [location]);

  useEffect(() => {
    const fetchAvatar = async () => {
      if (user) {
        try {
         
          const response = await api.get('profiles/');
          const myProfile = response.data[0]; 
          if (myProfile && myProfile.avatar) {
             const path = myProfile.avatar;
             const fullPath = path.startsWith('http') ? path : `http://127.0.0.1:8000${path}`;
             setAvatarUrl(fullPath);
          }
        } catch (error) {
          console.error("Errore caricamento avatar navbar", error);
        }
      }
    };
    fetchAvatar();
  }, [user]);

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login'; // Usa href per pulire tutto
  };
  const isActive = (path) => location.pathname === path ? 'text-info fw-bold' : 'text-light opacity-75';

  const menuTextStyle = {
    color: '#fab1a0',     
    textShadow: '0 0 5px rgba(0,0,0,0.5)', 
    fontSize: '1.1rem',   
    textDecoration: 'none',
    transition: '0.3s'
  };

  const getLinkStyle = (path) => ({
    ...menuTextStyle,
    color: location.pathname === path ? '#eac66eff' : menuTextStyle.color, 
    fontWeight: location.pathname === path ? 'bold' : 'normal',
    borderBottom: location.pathname === path ? '2px solid #eac66eff' : 'none'
  });

  return (
    <nav className="navbar navbar-dark px-3 mb-4" style={{ position: 'relative', background: 'linear-gradient(rgba(233, 69, 96, 0.3),rgba(233, 69, 96, 0.15) 0%, transparent 100%)' }}>
      <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
          <img 
              src={logoImg} 
              alt="Logo" 
              style={{ 
                  height: '40px',
                  marginRight: '3px',
                  borderRadius: '50%'
              }} 
          />
          Cleaning League
      </Link>      
      {user && (
            <div className="d-flex gap-4"
                style={{
                  position: 'absolute',  
                    left: '50%',          
                    transform: 'translateX(-50%)',
                    zIndex: 10
                }}
            >
              <Link to="/dashboard" style={getLinkStyle('/dashboard')}>
                      Dashboard
                  </Link>
              <Link to="/task-market" style={getLinkStyle('/task-market')}>
                      Missioni
                  </Link>
              <Link to="/admin" style={getLinkStyle('/admin')}>
                      League
                  </Link>
            </div>
        )}

      <div>
        {user ? (
          <div className="d-flex align-items-center gap-3">
              {/* Avatar e Nome */}
              <Link to="/profile" className="d-flex align-items-center text-decoration-none gap-2 text-white">
                  <img 
                    src={avatarUrl || "https://via.placeholder.com/40?text=U"} 
                    alt="user" 
                    style={{
                        width: '35px', 
                        height: '35px', 
                        borderRadius: '50%', 
                        objectFit: 'cover',
                        border: '2px solid #eac66eff'
                    }} 
                  />
                  <span className="d-none d-md-inline small">{user.username}</span>
              </Link>
          <button onClick={handleLogout} className="btn btn-sm fw-bold"
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '20px',
              cursor: 'pointer',
              marginLeft: '1px'
            }}
          >
            Esci
          </button>
          </div>
        ) : (
          <div className="d-flex gap-2">
            <Link to="/login" className="btn fw-bold btn-sm"
              style={{
                backgroundColor: 'transparent', 
                color: '#ffffffff',           
                border: '1px solid #1a1a2e',
                borderRadius: '20px',
                padding: '5px 20px',
                textDecoration: 'none',
                transition: '0.3s'
            }}>Accedi</Link>
            <Link to="/register" className="btn btn-sm fw-bold"
              style={{
                backgroundColor: '#198755',
                color: '#ffffff',        
                border: '1px solid #1a1a2e',
                borderRadius: '20px',
                padding: '5px 20px',
                textDecoration: 'none'
            }}>Registrati</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Menubar;