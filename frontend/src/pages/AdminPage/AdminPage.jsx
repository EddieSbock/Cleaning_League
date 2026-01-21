import React, { useState, useEffect } from 'react';
import api from '../../services/api'; 
import './AdminStyle.css';
import authService from '../../services/auth';

const AdminPage = () => {
    
    const [activeSession, setActiveSession] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState(''); //è vuoto, bisogna metterci una data di fine
    const [isAdmin, setIsAdmin] = useState(false);
    const [houseId, setHouseId] = useState(null);
    // stato per nuova task
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        xp_reward: 50,  
        max_users: 1,  // impostazione modificabile, è un default
    });

    const [tempSubtask, setTempSubtask] = useState('');
    const [subtasksList, setSubtasksList] = useState([]);

    // carimaneto iniziale
    useEffect(() => {
        const initData = async () => {
            const myHouseId = await checkAdminStatus();
            if (myHouseId) {
            await fetchSessionStatus(myHouseId);
            }
        };
        initData();
    }, []);

    const parseJwt = (token) => {
        try {
            if (!token) return null;
            // Prende la parte centrale del token e la decodifica
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("Errore decodifica token", e);
            return null;
        }
    };

    const checkAdminStatus = async () => {
        try {
            const token = authService.getCurrentUser();

            let myId = null;
            if (typeof token === 'string') {
                const decoded = parseJwt(token);
                if (decoded) {
                    myId = decoded.user_id; // Di solito nei JWT Django l'id è qui
                }
            } else if (token && token.user_id) {
                myId = token.user_id;
            }

            console.log("ID decodificato:", myId);

            const houseRes = await api.get('houses/');
            
            
            if (houseRes.data.length > 0) {
                const myHouse = houseRes.data[0];

                setHouseId(myHouse.id);

                console.log("Dati Casa:", myHouse);
                console.log("Confronto: admin ID (" + myHouse.admin + ") vs user ID (" + myId + ")");
            

            if (String(myHouse.admin) === String(myId)) { //confronto id per verificare l'admin
                setIsAdmin(true);
            } else {
                setIsAdmin(false);  
            }

            return myHouse.id;
        }
        return null;
        } catch (error) {
            console.error("Errore verifica admin", error);
            return null;
        }
    };

    const fetchSessionStatus = async (specificHouseId = null) => {
        try {
            const idToUse = specificHouseId || houseId;
            if (!idToUse) return;
            const res = await api.get('sessions/');
            // Cerca se c'è una sessione attiva
            const current = res.data.find(s => s.is_active && s.house === idToUse);
            setActiveSession(current);
        } catch (error) {
            console.error("Errore check sessione", error);
        }
    };

    const handleStartSession = async () => {
      if (!startDate || !endDate) {
        alert("Seleziona una data di inizio e fine!");
        return;
    }

    if (startDate > endDate) {
          alert("La data di inizio non può essere dopo la data di fine!");
          return;
      }

    if (!houseId) {
          alert("Errore: ID Casa non trovato. Ricarica la pagina.");
          return;
      }

    try {

        const formattedStartDate = `${startDate}T00:00:00`;
        const formattedEndDate = `${endDate}T23:59:00`;

        await api.post('sessions/', {
            is_active: true,
            start_time: formattedStartDate,
            end_time: formattedEndDate,
            house: houseId
        });
            
            alert('⏱️ Nuova Sessione Avviata!');
            fetchSessionStatus(); // Aggiorna la vista
        } catch (error) {
            console.error(error);
            alert('Errore avvio sessione.');
        }
    };

    const handleStopSession = async () => {
        if (!activeSession) return;
        
        const confirm = window.confirm("Sei sicuro di voler terminare la sessione in anticipo?");
        if (!confirm) return;

        try {
            await api.patch(`sessions/${activeSession.id}/`, {
                is_active: false
            });
            alert('🛑 Sessione terminata manualmente.');
            setActiveSession(null); // Aggiorna stato locale
            fetchSessionStatus();   // Aggiorna dal server
        } catch (error) {
            console.error("Errore stop sessione", error);
            alert("Impossibile fermare la sessione.");
        }
    };

    const addSubtask = () => {
        if (!tempSubtask.trim()) return;
        // aggiunge alla lista locale
        setSubtasksList([...subtasksList, { description: tempSubtask }]);
        setTempSubtask(''); 
    };

    const removeSubtask = (index) => {
        setSubtasksList(subtasksList.filter((_, i) => i !== index));
    };

    // creazione task
    const handleCreateTask = async () => {
        if (!activeSession) {
            alert("Devi avviare una sessione prima di creare la task!");
            return;
        }

        try {
         
            const payload = {
                session: activeSession.id, 
                title: newTask.title,
                description: newTask.description,
                xp_reward: parseInt(newTask.xp_reward),
                max_users: parseInt(newTask.max_users),
                subtasks: subtasksList 
            };

            await api.post('tasks/', payload);

            alert('Task Creata con successo!');
            
            
            setNewTask({ title: '', description: '', xp_reward: 50, max_users: 1 });
            setSubtasksList([]);
        } catch (error) {
            console.error("Errore creazione task:", error.response?.data || error);
            alert('Errore creazione task. Controlla la console.');
        }
    };

    return (
        <div className="admin-container">
            <h1 className="admin-header"> 
                {isAdmin ? "Centro di Comando" : "Stato della lega"}</h1>

            {}
            <div className="admin-card">
                <h2>  Gestione Sessione</h2>
                
                {activeSession ? (
                    <div className="session-active-msg">
                        <p style={{color: '#00ff00e1', fontWeight: 'bold', fontSize: '1.2rem'}}> 
                            SESSIONE ATTIVA (ID: {activeSession.id})</p>
                        <small>Scade il: {new Date(activeSession.end_time).toLocaleDateString()}</small>

                        {isAdmin && (
                            <div style={{marginTop: '20px', borderTop: '1px solid #ffffff33', paddingTop: '15px'}}>
                                <button 
                                    className="btn-action" 
                                    onClick={handleStopSession}
                                    style={{backgroundColor: '#e74d3ccb'}}
                                >
                                    TERMINA SESSIONE ORA
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        {isAdmin ? (
                            <>
                                <p className="info-text">Nessuna sessione attiva. Avviane una per permettere ai coinquilini di giocare.</p>
                                <div className="form-group">
                                    <label>Data di Inizio</label>
                                    <input 
                                        type="date" 
                                        className="admin-input"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        min={new Date().toISOString().split("T")[0]} 
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Data di fine sessione </label>
                                    <input 
                                        type="date" 
                                        className="admin-input"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        min={new Date().toISOString().split("T")[0]} /* impedisce l'uso di date passate*/
                            />
                                </div>
                                <button className="btn-action" onClick={handleStartSession}>
                                    AVVIA NUOVA SESSIONE
                                </button>
                            </>
                            ) : (
                                <p className='info-text' style={{color: '#aaa'}}>
                                    Attualmente non ci sono sessioni di pulizia attive. 
                                    <br/>L'admin avvierà presto una nuova sfida!
                                </p>
                        )}
                    </div>
                )}
            </div>

            {isAdmin ? (
                activeSession && (
                <div className="admin-card">
                    <h2> 🧹 Crea Nuova Missione</h2>
                    
                    <div className="form-group">
                        <label>Titolo Missione</label>
                        <input 
                            type="text" 
                            className="admin-input" 
                            placeholder="Es. Pulizia Bagno Profonda"
                            value={newTask.title}
                            onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                        />
                    </div>

                    <div className="form-group">
                        <label>Descrizione</label>
                        <textarea 
                            className="admin-input" 
                            rows="3"
                            placeholder="Scrivi cosa bisogna fare..."
                            value={newTask.description}
                            onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group half">
                            <label>XP Reward</label>
                            <input 
                                type="number" 
                                className="admin-input" 
                                value={newTask.xp_reward}
                                onChange={(e) => setNewTask({...newTask, xp_reward: e.target.value})}
                            />
                        </div>
                        <div className="form-group half">
                            <label>Max Utenti</label>
                            <input 
                                type="number" 
                                className="admin-input" 
                                value={newTask.max_users}
                                onChange={(e) => setNewTask({...newTask, max_users: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Sezione per obiettivi secondari */}
                    <div className="subtasks-section">
                        <label style={{color: '#eac66eff'}}> Obiettivi Secondari (Subtasks)</label>
                        
                        <div className="subtasks-list">
                            {subtasksList.map((sub, index) => (
                                <div key={index} className="subtask-item">
                                    <span>{sub.description}</span>
                                    <button className="btn-remove" onClick={() => removeSubtask(index)}>×</button>
                                </div>
                            ))}
                        </div>

                        <div className="add-subtask-box">
                            <input 
                                type="text" 
                                className="admin-input"
                                placeholder="Es. Pulire lo specchio..."
                                value={tempSubtask}
                                onChange={(e) => setTempSubtask(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                            />
                            <button className="btn-small" onClick={addSubtask}>+</button>
                        </div>
                    </div>

                    <button className="btn-action" onClick={handleCreateTask}>
                        PUBBLICA TASK
                    </button>
                </div>
            ) 
         ) : (
                <div className="admin-card" style={{textAlign: 'center', opacity: 0.7}}>
                                    <h3 style={{color: '#ffd700'}}>Zona Riservata all'Admin</h3>
                                    <p>
                                        Solo l'amministratore della casa può creare nuove missioni o terminare la sessione.
                                    </p>
                                    <p style={{fontStyle: 'italic', marginTop: '10px', color: '#00fff5'}}>
                                        "Se vuoi modificare qualcosa o proporre una task, chiedi all'Admin!"
                                    </p>
                                </div>
            )}
        </div>
    );
};

export default AdminPage;