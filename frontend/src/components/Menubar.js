import { Link } from 'react-router-dom';

function Menubar() { // Menu di navigazione dell'app
  return (
    <nav className="navbar navbar-dark bg-dark px-3">
      {/* Link al logo/nome dell'app */}
      <Link className="navbar-brand" to="/"> Cleaning League</Link>
      
      <div>
        {/* Pulsanti di navigazione a destra */}
        <Link to="/login" className="btn btn-outline-light btn-sm me-2">Login</Link>
        <Link to="/classifica" className="btn btn-warning btn-sm">Classifica </Link>
      </div>
    </nav>
  );
}

export default Menubar;