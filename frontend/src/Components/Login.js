// src/Components/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const qs = require('qs');
      const data = qs.stringify({ username, password });

      const response = await axios.post('http://localhost:8006/login', data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token, role, message } = response.data;
      localStorage.setItem('token', access_token);
      setMessage(message);

      if (role === 'admin') navigate('/admin');
      else if (role === 'institution') navigate('/institution');
    } catch (error) {
      console.error(error);
      setMessage('فشل تسجيل الدخول');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">LOGIN</button>
        </form>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

export default Login;
