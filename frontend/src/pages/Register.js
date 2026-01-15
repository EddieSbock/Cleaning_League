import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/auth';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await authService.register(username, email, password);
      await authService.login(username, password); //serve per fare l'auto-login
      alert("Registrazione avvenuta con successo! Benvenuto in Cleaning League !");
      window.location.href="/"; //così rimanda direttamente alla scelta della casa
    } catch (err) {
      console.error(err);
      alert("Errore. Username già utilizzato");
    }
  };

  const cardStyle = {
    backgroundColor: '#1a1a2e', // Sfondo molto scuro quasi nero
    border: '2px solid #800000',              // Bordo Rosso Scuro
    borderRadius: '15px',
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.8)',
    color: '#eac66eff',                         // Testo
    width: '400px'
  };

  const inputStyle = {
    backgroundColor: '#0f0f1a',   // Sfondo input
    border: '1px solid #eac66eff',  // Bordo
    color: '#eac66eff',               // Testo digitato
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(235, 187, 67, 0.57)'
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
        
        <h2 className="text-center mb-4" style={{ textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 0 10px #800000' }}>
          Nuovo Membro
        </h2>

        <form onSubmit={handleRegister}>
          
          <div className="mb-3">
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

          <div className="mb-3">
            <label className="form-label fw-bold">Email</label>
            <input 
              type="email" 
              className="form-control" 
              style={inputStyle}
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
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

          <button 
            type="submit" 
            className="btn w-100" 
            style={buttonStyle}
            onMouseOver={(e) => e.target.style.backgroundColor = '#a30000'} 
            onMouseOut={(e) => e.target.style.backgroundColor = '#800000'}
          >
            REGISTRATI ORA
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <span style={{color: 'rgba(255,255,255,0.6)'}}>Hai già un account? </span>
          <Link to="/login" style={{ color: '#ffd700', textDecoration: 'none', fontWeight: 'bold' }}>
            Accedi
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Register;