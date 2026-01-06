import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/auth';
import api from '../services/api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); //reindirizza a dashboard per login andati a buon fine

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await authService.login(username, password);
      const housesRes = await api.get('houses/');
        
        if (housesRes.data.length > 0) {
            // Se la lista non è vuota, ho una casa -> Vado alla Dashboard
            navigate('/dashboard');
        } else {
            // Se la lista è vuota, non ho una casa -> Vado a sceglierla
            navigate('/house-selection');
        }

        // Non serve più window.location.reload(), il navigate è sufficiente!
        
    } catch (err) {
        console.error(err);
        setError('Credenziali non valide! Riprova.');
    }
};

const cardStyle = {
    backgroundColor: '#1a1a2e', // Sfondo molto scuro quasi nero
    border: '2px solid #800000',              // Bordo Rosso Scuro
    borderRadius: '15px',
    boxShadow: '0 0 20px rgba(139, 0, 0, 0.3)', // Alone rosso leggero
    color: '#eac66eff',                         // Testo
    width: '400px'
  };

  const inputStyle = {
    backgroundColor: '#0f0f1a',   // Sfondo input
    border: '1px solid #eac66eff',  // Bordo
    color: '#eac66eff',               // Testo digitato
    borderRadius: '8px'
  };

  const buttonStyle = {
    backgroundColor: '#800000',   // Bottone Rosso Scuro
    border: 'none',
    color: 'white',
    fontWeight: 'bold',
    padding: '10px',
    borderRadius: '8px',
    marginTop: '10px',
    transition: '0.3s'
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      
      <div className="card p-5" style={cardStyle}>
        <h2 className="text-center mb-4" style={{ textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 0 5px #800000' }}>
          Accedi
        </h2>
        
        {error && <div className="alert alert-danger" style={{background: 'rgba(255,0,0,0.2)', border: '1px solid red', color: 'white'}}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="form-label fw-bold">Username</label>
            <input 
              type="text" 
              className="form-control" 
              style={inputStyle}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="form-label fw-bold">Password</label>
            <input 
              type="password" 
              className="form-control" 
              style={inputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn w-100" style={buttonStyle} onMouseOver={(e) => e.target.style.backgroundColor = '#a30000'} onMouseOut={(e) => e.target.style.backgroundColor = '#800000'}>
            ENTRA NELLA LEGA
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <span style={{color: 'rgba(255,255,255,0.6)'}}>Non hai un account? </span>
          <Link to="/register" style={{ color: '#eac66eff', textDecoration: 'none', fontWeight: 'bold' }}>
            Registrati qui
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;