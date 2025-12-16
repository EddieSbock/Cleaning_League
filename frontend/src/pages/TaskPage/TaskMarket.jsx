import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../App.css'; 
import './StylePage.css';

const TaskMarket = () => {
    // Stati per i dati
    const [availableTasks, setAvailableTasks] = useState([]);
    const [myInventory, setMyInventory] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    
    // Stati per il caricamento
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Caricamento dati all'avvio
    useEffect(() => {
        const fetchData = async () => {
            try {
                const tasksResponse = await axios.get('http://localhost:5000/api/tasks/'); 
                setAvailableTasks(tasksResponse.data);
                setLoading(false);
            } catch (err) {
                console.error("Errore caricamento:", err);
                setError("Impossibile caricare la bacheca.");
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSelectTask = (task) => {
        setSelectedTask(task);
    };

    const handleAcceptTask = async () => {
        if (!selectedTask) return;
    
        try {
            // Chiamata al backend Django
            await axios.post(`http://localhost:5000/api/tasks/${selectedTask.id}/grab/`, {});
            setMyInventory([...myInventory, selectedTask]);
            //aggiorna solo lo stato locale per dire che è presa
            const updatedTasks = availableTasks.map(t => 
                t.id === selectedTask.id 
                ? { ...t, is_taken_by_me: true, taken_seats: (t.taken_seats || 0) + 1 } 
                : t
            );
            setAvailableTasks(updatedTasks);

            // Chiudi pannello e avvisa
            setSelectedTask(null);
            alert("Task accettata con successo!");
    
        } catch (err) {
            console.error("Errore API:", err);
            
            if (err.response && err.response.data && err.response.data.error) {
                alert("Errore: " + err.response.data.error);
            } else {
                alert("Impossibile accettare la task. Riprova più tardi.");
            }
        }
    };
    
    if (loading) return <div className="text-center mt-5">Caricamento missioni in corso...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div className="market-container"> 
            
            {/* Header */}
            <header className="market-header">
                <h1>Bacheca Missioni</h1>
                <p>Scegli la tua prossima sfida</p>
            </header>

            {/* Griglia Card */}
            <div className="grid-container">
                {availableTasks.map(task => (
                <div 
                    key={task.id} 
                    className={`task-card ${selectedTask?.id === task.id ? 'active-selection' : ''}`}
                    onClick={() => handleSelectTask(task)}
                >
                    <div className="task-title">{task.title}</div>
                    <div className="task-xp">+{task.xp} XP</div>
                    
                    <div className="task-dates">
                        <small style={{color: '#aaa', fontSize: '0.8em'}}>Orario Sessione:</small>
                        <br/>
                        {/*gestione date*/}
                        {task.session_start ? new Date(task.session_start).toLocaleDateString() : 'N/D'} 
                        {' '}
                        <span style={{color: '#fff', fontWeight: 'bold'}}>
                            (
                            {task.session_start ? new Date(task.session_start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                            {' - '}
                            {task.session_end ? new Date(task.session_end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                            )
                        </span>
                    </div>
                </div>
                ))}
                
                {availableTasks.length === 0 && !loading && (
                    <p style={{color: 'white', gridColumn: '1/-1', textAlign: 'center'}}>
                        Nessuna missione disponibile al momento.
                    </p>
                )}
            </div>

            {/* Monitor Dettagli */}
            {selectedTask && (
                <div className="monitor-panel">
                    <h2>{selectedTask.title}</h2>
                    <div className="monitor-body">
                        <p>{selectedTask.description || selectedTask.desc}</p>
                        
                        <div className="monitor-stats">
                            <span>XP: {selectedTask.xp}</span>
                            <br/>
                            <span>Posti: {selectedTask.taken_seats || 0} / {selectedTask.max_assignees}</span>
                        </div>
                        
                        {/* IL BOTTONE INTELLIGENTE */}
                        <button 
                            className="btn-action" 
                            onClick={handleAcceptTask}
                            disabled={selectedTask.is_taken_by_me || (selectedTask.taken_seats >= selectedTask.max_assignees)}
                            style={{
                                background: (selectedTask.is_taken_by_me || (selectedTask.taken_seats >= selectedTask.max_assignees))
                                    ? '#555' 
                                    : '#00fff5',
                                cursor: (selectedTask.is_taken_by_me || (selectedTask.taken_seats >= selectedTask.max_assignees))
                                    ? 'not-allowed'
                                    : 'pointer'
                            }}
                        >
                            {selectedTask.is_taken_by_me 
                                ? "GIÀ PRESA" 
                                : ((selectedTask.taken_seats >= selectedTask.max_assignees) ? "PIENO" : "ACCETTA MISSIONE")
                            }
                        </button>
                        
                        <button className="btn-secondary" onClick={() => setSelectedTask(null)}>
                            CHIUDI
                        </button>
                    </div>
                </div>
            )}

            {/* Inventario Utente */}
            <div className="inventory-box">
                <h3>Le tue Missioni</h3>
                <div className="mini-cards-container">
                    {myInventory.map((task, index) => (
                        <div key={task.id || index} className="mini-card">
                            <strong>{task.title}</strong><br/>XP: {task.xp}
                        </div>
                    ))}
                    {myInventory.length === 0 && (
                        <p style={{fontSize:'0.8rem', color:'#aaa'}}>Nessuna missione attiva.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskMarket;