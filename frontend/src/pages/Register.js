import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/auth';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

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

  return (
    <div className="d-flex justify-content-center mt-5">
      <div className="card shadow p-4" style={{ width: '400px' }}>
        <h2 className="text-center mb-4">Nuovo Membro</h2>
        <form onSubmit={handleRegister}>
          <div className="mb-3">
            <label>Username</label>
            <input type="text" className="form-control" 
              value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label>Email</label>
            <input type="email" className="form-control" 
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label>Password</label>
            <input type="password" className="form-control" 
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-success w-100">Registrati</button>
        </form>
        <p className="mt-3 text-center">
          Hai già un account? <Link to="/login">Accedi</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;