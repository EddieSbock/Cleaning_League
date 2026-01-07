import React, { useState, useEffect } from 'react';
import '../TaskPage/StylePage.css';
import api from '../../services/api';
import authService from '../../services/auth';

const TaskMarket = () => {
  const [marketTasks, setMarketTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [myInventory, setMyInventory] = useState([]);


  const getUserId = () => {
      const userToken = authService.getCurrentUser();
      if (!userToken) return null;
      if (userToken.user_id) return userToken.user_id;
      try {
          const base64Url = userToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
          return JSON.parse(jsonPayload).user_id;
      } catch (e) { return null; }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  const loadData = async (isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);

    try {
        const myId = getUserId();
        setCurrentUserId(myId);

        const houseRes = await api.get('houses/');
        if (houseRes.data.length === 0) { setLoading(false); return; }
        const myHouseId = houseRes.data[0].id;

        const sessionsRes = await api.get('sessions/');
        const activeSession = sessionsRes.data.find(s => s.is_active && s.house === myHouseId);

        if (!activeSession) {
            setMarketTasks([]); 
            setLoading(false);
            return;
        }

        
        const tasksRes = await api.get('tasks/');
        const allTasks = tasksRes.data.filter(t => t.session === activeSession.id);
        
        const mine = [];
        const market = [];

        allTasks.forEach(task => {
            
            if (task.is_taken_by_me === true) {
                mine.push(task);
            } else {
                market.push(task);
            }
        });

        console.log(`DEBUG: ${mine.length} Mie (is_taken_by_me=true), ${market.length} Mercato`);

        setMyInventory(mine);
        setMarketTasks(market);

    } catch (err) {
        console.error("Errore caricamento:", err);
    } finally {
        if (isInitialLoad) setLoading(false);
    }
  };

  const handleAcceptTask = async () => {
      if (!selectedTask) return;

      try {
        
          await api.post(`tasks/${selectedTask.id}/grab/`, {user_id: currentUserId});
          
          alert("Missione accettata!");


          const updatedTask = { 
              ...selectedTask, 
              is_taken_by_me: true,
              // da fixare quando il backend manderà i dati giusti
              taken_seats: (selectedTask.taken_seats || 0) + 1 
          };
          
         
          setMyInventory(prev => [...prev, updatedTask]);
          setMarketTasks(prev => prev.filter(t => t.id !== selectedTask.id));
          
          setSelectedTask(null); 
          
         
          setTimeout(() => {
              loadData(false); 
          }, 800); 

      } catch (err) {
          console.error(err);
          alert("Errore nell'accettare la task.");
      }
  };

  const openTaskDetails = (task) => {
      setSelectedTask(task);
  };

  if (loading) return <div style={{color:'white', padding:'20px'}}>Caricamento...</div>;

  const isSelectedTaskMine = selectedTask && myInventory.some(t => t.id === selectedTask.id);

  return (
   <div className="market-container"> 
      
      <header className="market-header">
        <h1>Bacheca Missioni</h1>
        <p>Scegli la tua prossima sfida</p>
      </header>

      <div className="grid-container">
        {marketTasks.length > 0 ? (
            marketTasks.map(task => {
                const seatsTaken = task.taken_seats || 0; 
                const maxUsers = task.max_users || 1;
                const isFull = seatsTaken >= maxUsers;

                return (
                  <div 
                    key={task.id} 
                    className={`task-card ${isFull ? 'full' : ''}`}
                    onClick={() => !isFull && setSelectedTask(task)}
                  >
                    <div className="task-title" style={{color: '#eac66eff', fontWeight:'bold', fontSize:'1.2rem'}}>
                        {task.title}
                    </div>
                    <div className="task-xp" style={{color: '#ffd700', fontWeight:'bold'}}>
                        +{task.xp_reward} XP
                    </div>
                    <div style={{marginTop:'10px', fontSize:'0.9rem', color:'#aaa'}}>
                        Posti: {seatsTaken} / {maxUsers}
                    </div>
                    {isFull && <div style={{color:'red', fontWeight:'bold', marginTop:'5px'}}>PIENO</div>}
                  </div>
                );
            })
        ) : (
            <p style={{color:'#aaa', gridColumn:'1/-1', textAlign:'center'}}>Nessuna nuova missione disponibile.</p>
        )}
      </div>

      <div className="inventory-box">
        <h3 style={{color: '#eac66eff', fontSize: '1.5rem', marginTop: 0}}>Le tue Missioni</h3>
            {myInventory.length > 0 ? (
                myInventory.map((task, index) => (
                    <div 
                        key={task.id || index} 
                        className="mini-card"
                        style={{cursor: 'pointer'}}
                        onClick={() => openTaskDetails(task)}
                    >
                       <div style={{fontWeight:'bold'}}>{task.title}</div>
                       <div style={{fontSize:'0.75rem'}}>+{task.xp_reward} XP</div>
                    </div>
            ))
        ) : (
            <p style={{fontSize:'0.8rem', color:'#aaa'}}>Nessuna missione attiva.</p>
        )}
      </div>

      {selectedTask && (
        <div className="monitor-panel">
            <h2 style={{color:'white'}}>{selectedTask.title}</h2>
            
            <div className="monitor-body" style={{color:'#ccc', marginTop:'15px'}}>
                <p><strong>Ricompensa:</strong> <span style={{color:'#ffd700'}}>{selectedTask.xp_reward} XP</span></p>
                <p><strong>Obiettivo:</strong> {selectedTask.description}</p>
                
                {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                    <div style={{background:'rgba(0,0,0,0.3)', padding:'10px', borderRadius:'5px'}}>
                        <small>Passaggi:</small>
                        <ul style={{paddingLeft:'20px', margin:'5px 0'}}>
                            {selectedTask.subtasks.map((sub, i) => (
                                <li key={i}>{sub.description || sub}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {!isSelectedTaskMine ? (
                    <button className="btn-action" onClick={handleAcceptTask}>
                        ACCETTA MISSIONE
                    </button>
                ) : (
                    <div style={{
                        marginTop:'15px', padding:'10px', border:'1px solid #00ff00', 
                        color:'#00ff00', textAlign:'center', borderRadius:'5px'
                    }}>
                        MISSIONE GIÀ TUA
                    </div>
                )}
                
                <button className="btn-secondary" onClick={() => setSelectedTask(null)}>
                    CHIUDI
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default TaskMarket;