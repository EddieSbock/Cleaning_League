import React, { useEffect, useState } from 'react';
import api from '../services/api';

function Dashboard() { // Finestra che mostra i compiti da svolgere
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    api.get('tasks/') 
      .then(res => setTasks(res.data))
      .catch(err => console.error("Errore:", err));
  }, []);

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Le Task della Casa</h2>
      <div className="row">
        {tasks.map(task => (
          <div key={task.id} className="col-md-4 mb-3">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">{task.title}</h5>
                <p className="card-text">{task.description}</p>
                <button className="btn btn-primary btn-sm">Dettagli</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;