import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 
import authService from '../services/auth';
import './Dashboard.css';

const Dashboard = () => {
  const [house, setHouse] = useState(null);
  const [session, setSession] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [members, setMembers] = useState([]);
  const [timeLeft, setTimeLeft] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [view, setView] = useState('available');
  
  const navigate = useNavigate();

// caricamento iniziale
  useEffect(() => {
    const fetchData = async () => {
      try {
        const houseReq = await api.get('houses/');
        const myHouse = houseReq.data[0];
        setHouse(myHouse);

        if (myHouse) {
            const profilesReq = await api.get('profiles/');
            const houseMembers = profilesReq.data.filter(p => p.house === myHouse.id);
            setMembers(houseMembers);
        }

        const sessionsReq = await api.get('sessions/');
        const activeSession = sessionsReq.data.find(s => s.is_active);
        setSession(activeSession);

        if (activeSession) {
          refreshTasks(activeSession.id);
        }

        setLoading(false);
      } catch (error) {
        console.error("Errore caricamento dashboard:", error);
        
      
        if (error.response && error.response.status === 401) {
            alert("Sessione scaduta, rifai il login!");
            navigate('/login'); 
        }
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

    const refreshTasks = async (sessionId) => {
      try {
        const tasksReq = await api.get('tasks/');
        const sessionTasks = tasksReq.data.filter(t => t.session === sessionId);
        setTasks(sessionTasks);

        const assignReq = await api.get('assignments/');
        // Filtriamo solo quelle non completate dell'utente corrente
        // Nota: Assumiamo che l'API restituisca tutti gli assignment o che filtriamo lato client
        // Qui ci vorrebbe un controllo sull'ID utente, per ora filtro quelle 'TODO'
        setMyAssignments(assignReq.data.filter(a => a.status === 'TODO')); 
    } catch (error) {
        console.error("Errore refresh task", error);
    }
  };

  // Timer
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      const now = new Date();
      const end = new Date(session.end_time);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("SESSIONE TERMINATA");
        clearInterval(interval);
      } else {
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        setTimeLeft(`${hours}h ${minutes}m`);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [session]);

 
 //per il logout
  const handleLogout = () => {
  
    if (authService.logout) {
        authService.logout();
    } else {
        localStorage.removeItem('token');
    }
    navigate('/login');
  };

 // Azioni Pulsanti
  const handleGrabTask = async (taskId) => {
    try {
      await api.post(`tasks/${taskId}/grab/`);
      alert("Task presa! Al lavoro! 🧹");
      setView('mine');
      if(session) refreshTasks(session.id);
    } catch (error) {
      alert("Errore: " + (error.response?.data?.error || "Impossibile prendere la task"));
    }
  };

  const handleCompleteTask = async (assignmentId) => {
    try {
      const res = await api.post(`assignments/${assignmentId}/complete/`);
      alert(`Grande! Hai guadagnato ${res.data.earned_xp} XP!`);
      if(session) refreshTasks(session.id);
    } catch (error) {
      alert("Errore nel completamento");
    }
  };
  if (loading) return <div className="loading-screen">Caricamento...</div>;  
  
  if (!house) return (
    <div className="error-screen">
        <p>Non fai parte di nessuna casa!</p>
        <button onClick={handleLogout}>Esci</button>
    </div>
  );

  return (
    <div className="dashboard-container">
      
      {/* SIDEBAR SINISTRA */}
      <aside className="sidebar">
        <div className="house-header">
          <h2>🏠 {house.name}</h2>
          <p className="invite-code">Codice: <code>{house.invite_code}</code></p>
        </div>
        
        <div className="members-list">
             <h3>Squadra</h3>
             <ul>
                {members.map(m => (
                    <li key={m.id} className="member-item">
                        <div className="avatar-circle">{m.nickname.charAt(0)}</div>
                        <div className="member-info">
                          <span className="name">{m.nickname}</span>
                          <span className="level">Lvl. {member.level}</span>
                        </div>
                    </li>
                ))}
             </ul>
        </div>

        <div style={{marginTop: 'auto', paddingTop: '20px'}}>
            <button 
                onClick={handleLogout} 
                style={{width:'100%', padding:'10px', background:'#e74c3c', color:'white', border:'none', cursor:'pointer'}}>
                Esci
            </button>
        </div>
      </aside>



      <main className="main-content">
        <header className="dashboard-header">
          <div>
            <h1>{session ? session.name : "Nessuna Pulizia in Corso zzz..."}</h1>
            {session && <p>Corri per il bonus velocità!</p>}
          </div>
          {session && (
            <div className="timer-card">
                <span className="timer-icon">⏳</span>
                <span className="time-remaining">{timeLeft || "--:--"}</span>
            </div>
          )}
        </header>

        {session ? (
            <div className="grid-layout">
                
                {/* per le task */}

                <div className="card task-widget">
                    <div className="tabs">
                        <button className={view === 'available' ? 'active' : ''} onClick={() => setView('available')}>
                            Da Fare
                        </button>
                        <button className={view === 'mine' ? 'active' : ''} onClick={() => setView('mine')}>
                            Le Mie Task
                        </button>
                    </div>

                    <div className="task-list-scroll">
                        {view === 'available' ? (
                            tasks.filter(t => !t.is_taken_by_me && t.taken_seats < t.max_assignees).map(task => (
                                <div key={task.id} className="task-row">
                                    <div>
                                        <h4>{task.title}</h4>
                                        <span className="xp-tag">💎 {task.xp_reward} XP</span>
                                    </div>
                                    <button className="btn-grab" onClick={() => handleGrabTask(task.id)}>Prendi</button>
                                </div>
                            ))
                        ) : (
                            myAssignments.map(assign => (
                                <div key={assign.id} className="task-row mine">
                                    <div>
                                        <h4>Task #{assign.task}</h4> {/* inserire il titolo nel serializer */}
                                        <small>In corso...</small>
                                    </div>
                                    <button className="btn-complete" onClick={() => handleCompleteTask(assign.id)}>Fatto! ✅</button>
                                </div>
                            ))
                        )}
                        {view === 'available' && tasks.length === 0 && <p style={{padding:20, color:'#999'}}>Nessuna task libera.</p>}
                    </div>
                </div>

                {/* 2. CLASSIFICA TOTALE "test"*/}
                <div className="card total-leaderboard">
                    <h3>👑 Classifica Casa</h3>
                    <ul className="ranking-list">
                        {members.sort((a, b) => b.total_xp - a.total_xp).map((m, index) => (
                            <li key={m.id}>
                                <span>{index + 1}. {m.nickname}</span>
                                <strong>{m.total_xp} XP</strong>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        ) : (
            <div className="no-session-msg">
                <h3>Tutto pulito! (O forse no?)</h3>
                <p>L'admin non ha avviato nessuna sessione di pulizie.</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;