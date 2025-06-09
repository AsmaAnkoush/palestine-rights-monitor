import React from 'react';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <h2>Palestine Rights Monitor</h2>
      </div>
      <ul className="navbar-links">
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#how-it-works">How it works</a></li>
        <li><a href="#statistics">Statistics</a></li>
        <li><a href="#login" className="login-btn">Login</a></li>
      </ul>
    </nav>
  );
}

export default Navbar;
