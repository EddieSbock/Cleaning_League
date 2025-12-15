import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="container text-center mt-5">
      <div className="p-5 mb-4 bg-light rounded-3 shadow-sm">
        <h1 className="display-4 fw-bold">Cleaning League</h1>
        <p className="lead fs-4">
          Trasforma le faccende di casa in una sfida epica!<br />
        </p>
        <hr className="my-4" />
        <div className="d-grid gap-3 d-sm-flex justify-content-sm-center">
          <Link to="/login" className="btn btn-primary btn-lg px-4 gap-3">
            Accedi
          </Link>
          <Link to="/register" className="btn btn-outline-secondary btn-lg px-4">
            Registrati
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;