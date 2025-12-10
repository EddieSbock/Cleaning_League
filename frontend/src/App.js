import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Importiamo Bootstrap


import Menubar from './components/Menubar';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      {/* La Menubar sta FUORI dalle Routes così rimane fissa in tutte le pagine */}
      <Menubar />
      
      <div className="container mt-3">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          {/* Qui in futuro aggiungerai: <Route path="/login" element={<Login />} /> */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
