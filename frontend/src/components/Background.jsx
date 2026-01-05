import React from 'react';
import './Background.css';

const Background = () => {
  return (
    <div className="retro-container">
      {/* Il bagliore in alto */}
      <div className="retro-horizon"></div>
      
      {/* La griglia in movimento */}
      <div className="retro-grid"></div>
    </div>
  );
};

export default Background;