import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 
import authService from '../services/auth';
import './Dashboard.css';

const Dashboard = () => {
  const [house, setHouse] = useState(null);
  const [session, setSession] = useState(null);
  const [myAssignments, setMyAssignments] = useState([]);
  const [members, setMembers] = useState([]);
  const [timeLeft, setTimeLeft] = useState("");
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  // Helper ID Utente per capire chi sono "IO"
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
  const myId = getUserId();

  // 1. CARICAMENTO DATI
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
      try {
        // Scarica Casa e Membri
        const houseReq = await api.get('houses/');
        if (houseReq.data.length === 0) {
            setLoading(false);
            return; // Nessuna casa
        }
        const myHouse = houseReq.data[0];
        setHouse(myHouse);

        // Se i membri sono popolati
        if (myHouse.members) {
            setMembers(myHouse.members);
        }

        // Scarica Sessione Attiva
        const sessionsReq = await api.get('sessions/');
        const activeSession = sessionsReq.data.find(s => s.is_active && s.house === myHouse.id);
        setSession(activeSession);

        if (activeSession) {
          refreshMyTasks(activeSession.id);
        }

        setLoading(false);
      } catch (error) {
        console.error("Errore Dashboard:", error);
        if (error.response?.status === 401) {
            authService.logout();
            navigate('/login');
        }
        setLoading(false);
      }
  };

  const refreshMyTasks = async (sessionId) => {
      try {
          const assignReq = await api.get('assignments/');
          
          console.log("Assignments scaricati:", assignReq.data);

        
          const validAssignments = assignReq.data.filter(a => a.status === 'TODO');

          setMyAssignments(validAssignments);
      } catch (error) {
          console.error("Errore refresh tasks:", error);
      }
  };

  // 2. TIMER FIX
  useEffect(() => {
    if (!session) return;
    
    const calculateTime = () => {
      const now = new Date();
      const end = new Date(session.end_time);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("00:00");
        return;
      }
      
      const hours = Math.floor((diff / (1000 * 60 * 60)));
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      
      const hStr = hours > 0 ? `${hours}h ` : '';
      const mStr = minutes.toString().padStart(2, '0');
      const sStr = seconds.toString().padStart(2, '0');
      
      setTimeLeft(`${hStr}${mStr}:${sStr}`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [session]);

 
  const handleLeaveHouse = async () => {
      const confirm = window.confirm("⚠️ ATTENZIONE: Sei sicuro di voler abbandonare questa casa? Dovrai farti invitare di nuovo per rientrare.");
      if (confirm) {
          try {
            
              await api.post(`houses/leave/`, { house_id: house.id }); 
              localStorage.removeItem('houseId');
              alert("Hai abbandonato la casa.");
              window.location.href = '/house-selection'; 
          } catch (e) {
              console.error(e);
              alert("Errore: impossibile abbandonare la casa al momento.");
          }
      }
  };

  // 4. COMPLETAMENTO TASK
  const handleCompleteTask = async (assignmentId) => {
    const confirm = window.confirm("Hai davvero completato questa missione?");
    if (!confirm) return;

    try {
      const res = await api.post(`assignments/${assignmentId}/complete/`);
      
      const pointsEarned = res.data.earned_xp;

      alert(`🎉 MISSIONE COMPIUTA!\nHai guadagnato ${pointsEarned} XP!`);
      
      setMyAssignments(prev => prev.filter(a => a.id !== assignmentId));


      setMembers(prevMembers => prevMembers.map(m => {
          if (String(m.id) === String(myId)) {
              return { ...m, total_xp: m.total_xp + pointsEarned };
          }
          return m;
      }));
      
      setTimeout(() => {
          fetchData(); 
      }, 1000);

    } catch (error) {
      console.error(error);
      alert("Errore: " + (error.response?.data?.error || "Impossibile completare."));
    }
  };

  const renderAvatar = (member) => {
  //???????
    if (member.avatar) {
        const imageUrl = member.avatar.startsWith('http') ? member.avatar : `http://127.0.0.1:8000${member.avatar}`;
        return <img src={imageUrl} alt={member.nickname} className="avatar-img" />;
    }
    // Altrimenti avatar generico
    return (
        <div className="avatar-placeholder">
            {member.nickname.charAt(0).toUpperCase()}
        </div>
    );
  };

  if (loading) return <div className="loading-screen">Caricamento Dashboard...</div>;  
  
  if (!house) return (
    <div className="error-screen">
        <h2>Senza Fissa Dimora?</h2>
        <p>Non fai parte di nessuna casa.</p>
        <button className="btn-primary" onClick={() => {
            localStorage.removeItem('houseId');
            window.location.href = '/house-selection';
        }}>Unisciti o Crea</button>
    </div>
  );

  // Classifica
  const sortedMembers = [...members].sort((a, b) => b.total_xp - a.total_xp);
  const podium = sortedMembers.slice(0, 3);
  const others = sortedMembers.slice(3);

  return (
    <div className="dashboard-container">
      
      {/* SIDEBAR SINISTRA */}
      <aside className="sidebar">
        <div className="house-header">
          <h2>{house.name}</h2>
          <div className="invite-box">
             <small>Codice Invito: </small>
             <code>{house.invite_code}</code>
          </div>
        </div>
        
        <div className="members-list">
             <h3>Squadra</h3>
             <ul>
                {sortedMembers.map(m => {
                    const isMe = String(m.id) === String(myId);
                    return (
                        <li key={m.id} className={`member-item ${isMe ? 'is-me' : ''}`}>
                            {renderAvatar(m)}
                            <div className="member-info">
                              <span className="name">
                                  {m.nickname} 
                                  {isMe && <span className="me-badge"> (TU)</span>}
                              </span>
                              <span className="xp-badge-mini">{m.total_xp} XP</span>
                            </div>
                        </li>
                    );
                })}
             </ul>
        </div>

        {/* TASTO ABBANDONA (Sostituisce Logout) */}
        <div className="sidebar-footer">
            <button onClick={handleLeaveHouse} className="btn-leave-house">
                ⚠️ Abbandona Casa
            </button>
        </div>
      </aside>

      {/* CONTENUTO PRINCIPALE */}
      <main className="main-content">
        
        <header className="dashboard-header">
          <div className="header-text">
            <h1>{session ? "Sessione in Corso" : "💤 Nessuna attività"}</h1>
            {session && <p className="subtitle">Mancano poche ore! Corri a pulire!</p>}
          </div>
          
          {session ? (
            <div className="timer-box pulsating">
                <span className="timer-label">TEMPO RIMASTO</span>
                <span className="timer-digits">{timeLeft}</span>
            </div>
          ) : (
            <div className="timer-box inactive">
                <span>OFFLINE</span>
            </div>
          )}
        </header>

        {session ? (
            <div className="dashboard-grid">
                
                {/* COLONNA SINISTRA: LE MIE TASK */}
                <div className="tasks-column">
                    <div className="section-title">
                        <h3>📋 Le mie Missioni</h3>
                        <button className="btn-market" onClick={() => navigate('/task-market')}>
                            + Nuova
                        </button>
                    </div>

                    <div className="my-tasks-list">
                        {myAssignments.length > 0 ? (
                            myAssignments.map(assign => (
                                <div key={assign.id} className="task-card-row">
                                    <div className="task-info">
                                        <h4>{assign.task_title}</h4>
                                        <span className="xp-tag">+{assign.task.xp_reward} XP</span>
                                    </div>
                                    <button 
                                        className="btn-complete-task"
                                        onClick={() => handleCompleteTask(assign.id)}
                                    >
                                        COMPLETA
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <span style={{fontSize:'2rem'}}>🤷‍♂️</span>
                                <p>Non hai missioni attive.</p>
                                <small>Vai al mercato per prenderne una!</small>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLONNA DESTRA: CLASSIFICA */}
                <div className="leaderboard-column">
                    <h3>🏆 Classifica</h3>
                    
                    {/* PODIO */}
                    <div className="podium">
                        {/* 2° Posto */}
                        {podium[1] && (
                            <div className="podium-place silver">
                                {renderAvatar(podium[1])}
                                <span className="rank-num">2</span>
                                <span className="p-name">{podium[1].nickname}</span>
                                <span className="p-xp">{podium[1].total_xp}</span>
                            </div>
                        )}
                        
                        {/* 1° Posto */}
                        {podium[0] && (
                            <div className="podium-place gold">
                                {renderAvatar(podium[0])}
                                <span className="rank-num">1</span>
                                <span className="crown">👑</span>
                                <span className="p-name">{podium[0].nickname}</span>
                                <span className="p-xp">{podium[0].total_xp}</span>
                            </div>
                        )}

                        {/* 3° Posto */}
                        {podium[2] && (
                            <div className="podium-place bronze">
                                {renderAvatar(podium[2])}
                                <span className="rank-num">3</span>
                                <span className="p-name">{podium[2].nickname}</span>
                                <span className="p-xp">{podium[2].total_xp}</span>
                            </div>
                        )}
                    </div>

                    {/* LISTA ALTRI */}
                    <ul className="other-ranks">
                        {others.map((m, i) => (
                            <li key={m.id}>
                                <span className="rank-pos">#{i + 4}</span>
                                <span className="rank-name">{m.nickname}</span>
                                <span className="rank-xp">{m.total_xp} XP</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        ) : (
            <div className="no-session-hero">
                <h2>La casa riposa... per ora.</h2>
                <p>Attendere che l'Admin avvii una nuova sessione di pulizie.</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;