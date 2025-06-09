import React from 'react';
import ReactDOM from 'react-dom/client';  // استخدام 'react-dom/client' بدلاً من 'react-dom'
import './index.css';
import App from './App';

// استخدام createRoot بدلاً من render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
