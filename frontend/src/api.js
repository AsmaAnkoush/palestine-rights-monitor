// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8005',
});

export default api;
