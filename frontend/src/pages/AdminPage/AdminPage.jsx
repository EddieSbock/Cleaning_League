import React, { useState, useEffect } from 'react';
import api from '../../services/api'; 
import './AdminStyle.css';

const AdminPage = () => {
    
    const [activeSession, setActiveSession] = useState(null);
    const [endDate, setEndDate] = useState(''); //è vuoto, bisogna metterci una data di fine
    
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
        fetchSessionStatus();
    }, []);

    const fetchSessionStatus = async () => {
        try {
            const res = await api.get('sessions/');
            // Cerca se c'è una sessione attiva
            const current = res.data.find(s => s.is_active);
            setActiveSession(current);
        } catch (error) {
            console.error("Errore check sessione", error);
        }
    };

    const handleStartSession = async () => {
      if (!endDate) {
        alert("Seleziona una data di fine!");
        return;
    }

    try {
        //imposta l'orario di fine giornata alle 23:59
        const formattedDate = `${endDate}T23:59:00`;

        await api.post('sessions/', {
            is_active: true,
            end_time: formattedDate 
        });
            
            alert('⏱️ Nuova Sessione Avviata!');
            fetchSessionStatus(); // Aggiorna la vista
        } catch (error) {
            console.error(error);
            alert('Errore avvio sessione.');
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
            <h1 className="admin-header"> Centro di Comando</h1>

            {}
            <div className="admin-card">
                <h2>  Gestione Sessione</h2>
                
                {activeSession ? (
                    <div className="session-active-msg">
                        <p> SESSIONE ATTIVA (ID: {activeSession.id})</p>
                        <small>Scade il: {new Date(activeSession.end_time).toLocaleDateString()}</small>
                    </div>
                ) : (
                    <div>
                        <p className="info-text">Nessuna sessione attiva. Avviane una per permettere ai coinquilini di giocare.</p>
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
                    </div>
                )}
            </div>

            {}
            {activeSession && (
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
                        <label style={{color: '#00fff5'}}> Obiettivi Secondari (Subtasks)</label>
                        
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
            )}
        </div>
    );
};

export default AdminPage;