import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Usiamo api per fare le chiamate
import authService from '../services/auth'; // Per aggiornare il localStorage

function HouseSelection() {
  const [mode, setMode] = useState('initial');
  const [houseCode, setHouseCode] = useState('');
  const [houseName, setHouseName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  //Opzione 1: creazione casa
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Fa una chiamata al backend per creare la casa
      const response = await api.post('houses/', { name: houseName });
      
      localStorage.setItem('houseId', response.data.id);
      window.location.href = '/dashboard'; //Si prende l'ID della casa e va in dashboard 
    } catch (err) {
      setError("Errore nella creazione. Riprova.");
    }
  };

  //Opzione 2: unirsi ad una casa  
  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('houses/join/', { code: houseCode });
      // salva l'ID ed effettua l'accesso
      localStorage.setItem('houseId', response.data.id);
      alert("Benvenuto a casa!");
      window.location.href = '/dashboard';
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
       setError(err.response.data.error); // Mostra l'errore specifico del backend (es. "Codice non valido")
    } else {
       setError("Codice non valido o errore di connessione");
    }
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow-lg p-5 mx-auto" style={{ maxWidth: '600px' }}>
        <h2 className="text-center mb-4">Scegli la tua Casa</h2>
        
        {error && <div className="alert alert-danger">{error}</div>}

        {/* VISTA INIZIALE */}
        {mode === 'initial' && (
          <div className="d-grid gap-3">
            <button 
              className="btn btn-primary btn-lg py-3"
              onClick={() => setMode('join')}
            >
              Entra tramite codice invito
              <small className="d-block fw-light" style={{ fontSize: '0.8rem' }}>
                Unisciti a una casa già esistente
              </small>
            </button>
            
            <button 
              className="btn btn-outline-success btn-lg py-3"
              onClick={() => setMode('create')}
            >
              Crea nuova casa
              <small className="d-block fw-light" style={{ fontSize: '0.8rem' }}>
                Crea una nuova lega da zero
              </small>
            </button>
          </div>
        )}

        {}
        {mode === 'join' && (
          <form onSubmit={handleJoin}>
            <div className="mb-4">
              <label className="form-label fw-bold">Inserisci il Codice Casa</label>
              <input 
                type="text" 
                className="form-control form-control-lg text-center" 
                placeholder="es. X8K2P9"
                maxLength={8}
                value={houseCode}
                onChange={(e) => setHouseCode(e.target.value)}
                required
              />
              <div className="form-text text-center">Chiedi il codice all'admin.</div>
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-secondary flex-fill" onClick={() => setMode('initial')}>Indietro</button>
              <button type="submit" className="btn btn-primary flex-fill">Entra </button>
            </div>
          </form>
        )}

        {}
        {mode === 'create' && (
          <form onSubmit={handleCreate}>
            <div className="mb-4">
              <label className="form-label fw-bold">Dai un nome alla tua Casa</label>
              <input 
                type="text" 
                className="form-control form-control-lg" 
                placeholder="es. Casa bella"
                value={houseName}
                onChange={(e) => setHouseName(e.target.value)}
                required
              />
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-secondary flex-fill" onClick={() => setMode('initial')}>Indietro</button>
              <button type="submit" className="btn btn-success flex-fill">Crea </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}

export default HouseSelection;