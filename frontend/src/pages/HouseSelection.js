import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Usiamo api per fare le chiamate
import authService from '../services/auth'; // Per aggiornare il localStorage
import '../pages/HouseSelection.css';

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
      navigate('/dashboard');
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
    <div className="selection-container">
      <div className="selection-card">
        
        <h2 className="selection-title">
            {mode === 'initial' && "Scegli il tuo Destino"}
            {mode === 'join' && "Unisciti alla Squadra"}
            {mode === 'create' && "Fonda una Nuova Lega"}
        </h2>
        
        {error && <div className="error-msg">{error}</div>}

        {/* VISTA INIZIALE */}
        {mode === 'initial' && (
          <div className="options-grid">
            
            {/* Bottone Unisciti */}
            <div className="big-option-btn btn-join" onClick={() => setMode('join')}>
                <div>
                    <h3>Entra con Codice</h3>
                    <small>Unisciti a una casa già esistente</small>
                </div>
                <span style={{fontSize: '2rem'}}>🎟️</span>
            </div>
            
            {/* Bottone Crea */}
            <div className="big-option-btn btn-create" onClick={() => setMode('create')}>
                <div>
                    <h3>Crea Nuova Casa</h3>
                    <small>Crea una nuova lega da zero</small>
                </div>
                <span style={{fontSize: '2rem'}}>🏰</span>
            </div>

          </div>
        )}

        {/* VISTA JOIN */}
        {mode === 'join' && (
          <form onSubmit={handleJoin} className="form-section">
            <div className="mb-4">
              <label className="input-label">Inserisci il Codice Casa</label>
              <input 
                type="text" 
                className="custom-input" 
                placeholder="es. X8K2P9"
                maxLength={8}
                value={houseCode}
                onChange={(e) => setHouseCode(e.target.value)}
                required
              />
              <div className="hint-text">Chiedi il codice all'admin della casa.</div>
            </div>
            
            <div className="actions-row">
              <button type="button" className="action-btn btn-back" onClick={() => setMode('initial')}>Indietro</button>
              <button type="submit" className="action-btn confirm-join">ENTRA ORA</button>
            </div>
          </form>
        )}

        {/* VISTA CREATE */}
        {mode === 'create' && (
          <form onSubmit={handleCreate} className="form-section">
            <div className="mb-4">
              <label className="input-label" style={{color: '#e94560'}}>Nome della Casa</label>
              <input 
                type="text" 
                className="custom-input" 
                placeholder="es. La Lega dei Pulitori"
                value={houseName}
                onChange={(e) => setHouseName(e.target.value)}
                required
              />
              <div className="hint-text">Sarai l'Admin di questa nuova lega.</div>
            </div>
            
            <div className="actions-row">
              <button type="button" className="action-btn btn-back" onClick={() => setMode('initial')}>Indietro</button>
              <button type="submit" className="action-btn confirm-create">ANDIAMO</button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}

export default HouseSelection;