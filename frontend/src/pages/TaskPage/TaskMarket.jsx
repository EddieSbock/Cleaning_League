import React, { useState, useEffect } from 'react';
import './TaskPage/StylePage.css';
import axios from 'axios';

const TaskMarket = () => {
  const [availableTasks, setAvailableTasks] = useState([]);
  const [loading, setLoading] = useState(true); //mostra un caricamento
  const [error, setError] = useState(null);

  const [selectedTask, setSelectedTask] = useState(null);
  const [myInventory, setMyInventory] = useState([]);

  
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/tasks'); 
        
       } catch (err) {
        console.error(err);
        setError("Impossibile contattare il server Python");
    } finally {
        setLoading(false);
    }
};

fetchTasks ();
}, []);

 
    if (selectedTask && selectedTask.id === task.id) {
        setSelectedTask(null);
    } else {
        setSelectedTask(task);
    }
  };

  const handleAcceptTask = async () => {
    if (!selectedTask) return;

    try {
        
        await axios.post(`http://localhost:5000/api/tasks/${selectedTask.id}/grab/`, {});

        //se non va in errore, aggiorniamo la grafica
        setMyInventory([...myInventory, selectedTask]);
        setAvailableTasks(availableTasks.filter(t => t.id !== selectedTask.id));
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
       {}
        return (
    <div className="market-container"> 
      
      {}
      <header className="market-header">
        <h1>Bacheca Missioni</h1>
        <p>Scegli la tua prossima sfida</p>
      </header>

      {}
      <div className="grid-container">
        {availableTasks.map(task => (
          <div 
            key={task.id} 
            className={`task-card ${selectedTask?.id === task.id ? 'active-selection' : ''}`}
            onClick={() => handleSelectTask(task)}
          >
            <div className="task-title">{task.title}</div>
            <div className="task-xp">+{task.xp} XP</div>
            {}
            <div className="task-dates">
              <small style={{color: '#aaa', fontSize: '0.8em'}}>Orario Sessione:</small>
               <br/>
               {/*visualizzeremo start-end*/}
               {new Date(task.session_start).toLocaleDateString()} 
               {' '}
               <span style={{color: '#fff', fontWeight: 'bold'}}>
                (
                  {new Date(task.session_start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  {' - '}
                  {new Date(task.session_end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  )
                  </span>
                  </div>
                  </div>
        ))}
        
        {/*messaggio per task indisponibili*/}
        {availableTasks.length === 0 && !loading && (
            <p style={{color: 'white', gridColumn: '1/-1', textAlign: 'center'}}>
                Nessuna missione disponibile al momento.
            </p>
        )}
      </div>

      {}
      {selectedTask && (
        <div className="monitor-panel">
            <h2>{selectedTask.title}</h2>
            <div className="monitor-body">
                <div className="monitor-stats">
                     <span>XP: {selectedTask.xp}</span>
                     <br/>
                      {}
                      <span>Posti: {selectedTask.taken_seats} / {selectedTask.max_assignees}</span>
                      </div>
                      {}
                      <button 
                      className="btn-action" 
                      onClick={handleAcceptTask}
                      disabled={selectedTask.is_taken_by_me || selectedTask.taken_seats >= selectedTask.max_assignees}
                       style={{background: (selectedTask.is_taken_by_me || selectedTask.taken_seats >= selectedTask.max_assignees) 
                        ? '#555' 
                        : '#00fff5',
                        cursor: (selectedTask.is_taken_by_me || selectedTask.taken_seats >= selectedTask.max_assignees)
                        ? 'not-allowed'
                        : 'pointer'
                        }}
                        >   
                        {selectedTask.is_taken_by_me 
                        ? "GIÀ PRESA" 
                        : (selectedTask.taken_seats >= selectedTask.max_assignees ? "PIENO" : "ACCETTA MISSIONE")
                        }
                        </button>
                <p>{selectedTask.desc}</p>
                <div className="monitor-stats">
                    <span>XP: {selectedTask.xp}</span>
                    <br/>
                    {}
                    <span>Posti: {selectedTask.taken_seats|| 0}/{selectedTask.max_assignees}</span>
                </div>
                
                <button className="btn-action" onClick={handleAcceptTask}>
                    ACCETTA MISSIONE
                </button>
                
                <button className="btn-secondary" onClick={() => setSelectedTask(null)}>
                    CHIUDI
                </button>
            </div>
        </div>
      )}

      {/* task accettate*/}
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
    </div>
  );

export default TaskMarket;