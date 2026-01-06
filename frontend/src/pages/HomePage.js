import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  const cardStyle = {
    backgroundColor: '#1a1a2ee8', // Sfondo scuro semitrasparente
    border: '2px solid #800000',               // Bordo Rosso Scuro
    borderRadius: '20px',
    boxShadow: '0 0 30px rgba(139, 0, 0, 0.4)', // Glow rosso più ampio
    maxWidth: '800px',
    width: '90%',
    color: '#ffffff'
  };

  const titleStyle = {
    fontFamily: 'sans-serif',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '3px',
    color: '#eac66eff',          // Oro
    textShadow: '0 0 15px #800000, 2px 2px 0px #000' // Ombra rossa + contorno nero
  };

  const btnPrimaryStyle = {
    backgroundColor: '#800000',
    color: 'white',
    border: '2px solid #800000',
    padding: '12px 40px',
    borderRadius: '30px',
    fontWeight: 'bold',
    textDecoration: 'none',
    fontSize: '1.2rem',
    transition: '0.3s',
    display: 'inline-block'
  };

  const btnSecondaryStyle = {
    backgroundColor: 'transparent',
    color: '#eac66eff',
    border: '2px solid #eac66eff',
    padding: '12px 40px',
    borderRadius: '30px',
    fontWeight: 'bold',
    textDecoration: 'none',
    fontSize: '1.2rem',
    transition: '0.3s',
    display: 'inline-block'
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '85vh' }}>
      <div className="p-5 text-center" style={cardStyle}>
        
        {/* Titolo Principale */}
        <h1 className="display-3 mb-3" style={titleStyle}>Cleaning League</h1>
        
        {/* Sottotitolo */}
        <p className="lead fs-4 mb-4" style={{ color: 'rgba(255,255,255,0.8)', textShadow: '0 2px 4px black' }}>
          Trasforma le faccende di casa in una sfida epica!
        </p>
        
        <hr className="my-5" style={{ borderColor: '#800000', opacity: 0.6 }} />
        
        {/* Bottoni Azione */}
        <div className="d-flex gap-4 justify-content-center flex-wrap">
          
          <Link 
            to="/login" 
            style={btnPrimaryStyle}
            onMouseOver={(e) => {
                e.target.style.backgroundColor = '#a30000';
                e.target.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
                e.target.style.backgroundColor = '#800000';
                e.target.style.transform = 'scale(1)';
            }}
          >
            ACCEDI
          </Link>

          <Link 
            to="/register" 
            style={btnSecondaryStyle}
            onMouseOver={(e) => {
                e.target.style.backgroundColor = '#eac66eff'; 
                e.target.style.color = '#000';
                e.target.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
                e.target.style.backgroundColor = 'transparent'; 
                e.target.style.color = '#eac66eff';
                e.target.style.transform = 'scale(1)';
            }}
          >
            REGISTRATI
          </Link>

        </div>
      </div>
    </div>
  );
}

export default HomePage;