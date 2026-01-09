import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 
import authService from '../services/auth';
import './Dashboard.css';

const Dashboard = () => {
  const [house, setHouse] = useState(null);
  const [session, setSession] = useState(null);
  
  // STATI GIOCO
  const [myAssignments, setMyAssignments] = useState([]);
  
  // STATI VOTAZIONE (NUOVI)
  const [completedSessionTasks, setCompletedSessionTasks] = useState([]);
  const [votingId, setVotingId] = useState(null); // ID della task aperta per votare
  const [voteStars, setVoteStars] = useState(5);
  const [voteComment, setVoteComment] = useState("");

  const [members, setMembers] = useState([]);
  const [timeLeft, setTimeLeft] = useState("");
  
  // MODALITÀ: 'LOADING', 'GAME' (Attiva), 'VOTING' (Scaduta), 'NO_SESSION'
  const [mode, setMode] = useState('LOADING'); 
  
  const navigate = useNavigate();

  // Helper ID Utente
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
            setMode('NO_HOUSE'); // Gestiamo il caso senza casa
            return; 
        }
        const myHouse = houseReq.data[0];
        setHouse(myHouse);

        if (myHouse.members) {
            setMembers(myHouse.members);
        }

        // Scarica Sessione Attiva
        const sessionsReq = await api.get('sessions/');
        const activeSession = sessionsReq.data.find(s => s.is_active && s.house === myHouse.id);
        setSession(activeSession);

        if (activeSession) {
            checkSessionStatus(activeSession);
        } else {
            setMode('NO_SESSION');
        }

      } catch (error) {
        console.error("Errore Dashboard:", error);
        if (error.response?.status === 401) {
            authService.logout();
            navigate('/login');
        }
        setMode('NO_SESSION');
      }
  };

  // NUOVO: Controlla se siamo in gioco o ai voti
  const checkSessionStatus = (currentSession) => {
      const now = new Date();
      const end = new Date(currentSession.end_time);
      
      if (now > end) {
          // Sessione Scaduta -> Modalità VOTO
          setMode('VOTING');
          refreshVotingData();
      } else {
          // Sessione Attiva -> Modalità GIOCO
          setMode('GAME');
          refreshMyTasks(currentSession.id);
      }
  };

  const refreshMyTasks = async (sessionId) => {
      try {
          const assignReq = await api.get('assignments/');
          // Filtriamo le task TODO
          const validAssignments = assignReq.data.filter(a => a.status === 'TODO');
          setMyAssignments(validAssignments);
      } catch (error) {
          console.error("Errore refresh tasks:", error);
      }
  };

  // NUOVO: Scarica dati per votazione
  const refreshVotingData = async () => {
      try {
          const res = await api.get('assignments/session_recap/');
          setCompletedSessionTasks(res.data);
      } catch (err) { console.error(err); }
  };

  // 2. TIMER FIX (Aggiornato per cambio modalità)
  useEffect(() => {
    if (mode !== 'GAME' || !session) return;
    
    const calculateTime = () => {
      const now = new Date();
      const end = new Date(session.end_time);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("SESSIONE TERMINATA");
        // Passaggio automatico a votazione quando il tempo scade
        setMode('VOTING'); 
        refreshVotingData();
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
  }, [session, mode]);

 
  // 3. ABBANDONA CASA
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

      // Aggiorniamo XP localmente (e il livello se volessimo calcolarlo, ma basta l'XP per ora)
      setMembers(prevMembers => prevMembers.map(m => {
          if (String(m.id) === String(myId)) {
              return { ...m, total_xp: m.total_xp + pointsEarned };
          }
          return m;
      }));
      
      setTimeout(() => { fetchData(); }, 1000); // Ricarica per aggiornare tutto (anche livelli)

    } catch (error) {
      console.error(error);
      alert("Errore: " + (error.response?.data?.error || "Impossibile completare."));
    }
  };

  // 5. NUOVO: INVIO VOTO
  const submitVote = async (assignmentId) => {
      try {
          await api.post(`assignments/${assignmentId}/rate/`, {
              stars: voteStars,
              comment: voteComment
          });
          alert("Voto inviato!");
          setVotingId(null); // Chiude card
          setVoteComment(""); // Resetta form
          refreshVotingData(); // Aggiorna media voti
      } catch (err) {
          alert("Errore: " + (err.response?.data?.error || "Già votato?"));
      }
  };

  const renderAvatar = (memberOrObj) => {
    // Gestisce sia oggetto member che oggetto task votazione (che ha assignee_name/avatar)
    const nick = memberOrObj.nickname || memberOrObj.assignee_name || "?";
    const avatar = memberOrObj.avatar || memberOrObj.assignee_avatar;
    
    if (avatar) {
        const imageUrl = avatar.startsWith('http') ? avatar : `http://127.0.0.1:8000${avatar}`;
        return <img src={imageUrl} alt={nick} className="avatar-img" />;
    }
    return (
        <div className="avatar-placeholder">
            {nick.charAt(0).toUpperCase()}
        </div>
    );
  };

  if (mode === 'LOADING') return <div className="loading-screen">Caricamento Dashboard...</div>;  
  
  if (mode === 'NO_HOUSE') return (
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
  const sortedMembers = [...members].sort((a, b) => (b.session_xp || 0) - (a.session_xp || 0));

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
                              {/* NUOVO: Mostra Livello e XP */}
                              <div className="level-xp-row">
                                <span className="level-badge">Lv.{m.level} </span>
                                <span className="xp-badge-mini">{m.session_xp} XP</span>
                              </div>
                            </div>
                        </li>
                    );
                })}
             </ul>
        </div>

        <div className="sidebar-footer">
            <button onClick={handleLeaveHouse} className="btn-leave-house">
                ⚠️ Abbandona Casa
            </button>
        </div>
      </aside>

      {/* CONTENUTO PRINCIPALE */}
      <main className="main-content">
        
        {/* --- MODALITÀ GIOCO (SESSIONE ATTIVA) --- */}
        {mode === 'GAME' && (
            <>
                <header className="dashboard-header">
                    <div className="header-text">
                        <h1>🔥 Sessione in Corso</h1>
                        <p className="subtitle">Mancano poche ore! Corri a pulire!</p>
                    </div>
                    <div className="timer-box pulsating">
                        <span className="timer-label">TEMPO RIMASTO</span>
                        <span className="timer-digits">{timeLeft}</span>
                    </div>
                </header>

                <div className="dashboard-grid">
                    {/* LE MIE TASK */}
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
                                            <h4>{assign.task_title || "Missione"}</h4>
                                            <span className="xp-tag">+{assign.xp_reward || 0} XP</span>
                                        </div>
                                        <button className="btn-complete-task" onClick={() => handleCompleteTask(assign.id)}>
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

                    {/* CLASSIFICA GIOCO */}
                    <div className="leaderboard-column">
                        <h3>🏆 Classifica</h3>
                        <div className="podium">
                            {sortedMembers[1] && <div className="podium-place silver">{renderAvatar(sortedMembers[1])}<span className="rank-num">2</span><span className="p-name">{sortedMembers[1].nickname}</span><span className="p-xp">{sortedMembers[1].total_xp}</span></div>}
                            {sortedMembers[0] && <div className="podium-place gold">{renderAvatar(sortedMembers[0])}<span className="rank-num">1</span><span className="crown">👑</span><span className="p-name">{sortedMembers[0].nickname}</span><span className="p-xp">{sortedMembers[0].total_xp}</span></div>}
                            {sortedMembers[2] && <div className="podium-place bronze">{renderAvatar(sortedMembers[2])}<span className="rank-num">3</span><span className="p-name">{sortedMembers[2].nickname}</span><span className="p-xp">{sortedMembers[2].total_xp}</span></div>}
                        </div>
                        <ul className="other-ranks">
                            {sortedMembers.slice(3).map((m, i) => (
                                <li key={m.id}>
                                    <span className="rank-pos">#{i + 4}</span>
                                    <span className="rank-name">{m.nickname}</span>
                                    <span className="rank-xp">{m.total_xp} XP</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </>
        )}

        {/* --- MODALITÀ VOTAZIONE (SESSIONE TERMINATA) --- */}
        {mode === 'VOTING' && (
            <div className="voting-container">
                <header className="dashboard-header">
                    <h1>🏁 Sessione Terminata!</h1>
                    <p className="subtitle">È il momento di giudicare l'operato dei tuoi coinquilini.</p>
                </header>

                <div className="voting-list-section">
                    <h3>🗳️ Vota le Task Completate</h3>
                    
                    {completedSessionTasks.length > 0 ? (
                        completedSessionTasks.map(task => (
                            <div key={task.id} className="voting-card">
                                {/* Header Card - Clicca per espandere */}
                                <div className="voting-header" onClick={() => setVotingId(votingId === task.id ? null : task.id)}>
                                    <div className="v-info">
                                        {renderAvatar(task)}
                                        <div>
                                            <span className="v-user">{task.assignee_name}</span>
                                            <span className="v-task"> ha fatto: <strong>{task.task_title}</strong></span>
                                        </div>
                                    </div>
                                    <div className="v-stats">
                                        <span className="v-stars">⭐ {task.average_vote ? task.average_vote.toFixed(1) : '-'}</span>
                                        <button className="btn-toggle">{votingId === task.id ? '−' : '+'}</button>
                                    </div>
                                </div>

                                {/* Dettagli espandibili */}
                                {votingId === task.id && (
                                    <div className="voting-details">
                                        {/* Lista voti esistenti */}
                                        <div className="comments-list">
                                            {task.ratings && task.ratings.length > 0 ? (
                                                task.ratings.map(r => (
                                                    <div key={r.id} className="comment-item">
                                                        <strong>{r.voter_details}:</strong> {r.comment} <small>({r.stars}⭐)</small>
                                                    </div>
                                                ))
                                            ) : <p style={{color:'#666', fontStyle:'italic'}}>Nessun voto ancora.</p>}
                                        </div>

                                        {/* Form Voto (Solo se non sono io) */}
                                        {String(task.assignee_name) !== String(members.find(m => String(m.id) === String(myId))?.nickname) && (
                                            <div className="vote-form">
                                                <h4>Vota questa pulizia:</h4>
                                                <div style={{display:'flex', alignItems:'center'}}>
                                                    <select value={voteStars} onChange={e => setVoteStars(e.target.value)} className="star-select">
                                                        <option value="5">5 ⭐ - Eccellente</option>
                                                        <option value="4">4 ⭐ - Buono</option>
                                                        <option value="3">3 ⭐ - Ok</option>
                                                        <option value="2">2 ⭐ - Insufficiente</option>
                                                        <option value="1">1 ⭐ - Pessimo</option>
                                                    </select>
                                                    <input type="text" placeholder="Commento (opzionale)..." value={voteComment} onChange={e => setVoteComment(e.target.value)} className="comment-input" />
                                                    <button onClick={() => submitVote(task.id)} className="btn-submit-vote">INVIA</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p style={{textAlign:'center', marginTop:'20px'}}>Nessuna task completata da votare.</p>
                    )}
                </div>
            </div>
        )}

        {/* --- CASO NESSUNA SESSIONE --- */}
        {mode === 'NO_SESSION' && (
            <div className="no-session-hero">
                <h2>💤 Tutto tace...</h2>
                <p>Attendere che l'Admin avvii una nuova sessione di pulizie.</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;