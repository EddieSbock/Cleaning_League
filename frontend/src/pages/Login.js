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

  return (
    <div className="d-flex justify-content-center mt-5">
      <div className="card shadow p-4" style={{ width: '400px' }}>
        <h2 className="text-center mb-4"> Accedi</h2>
        
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label>Username</label>
            <input 
              type="text" 
              className="form-control" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label>Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">Invia</button>
        </form>
        
        <p className="mt-3 text-center">
          Non hai un account? <Link to="/register">Registrati qui</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;