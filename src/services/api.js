import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api', // Direct backend par hit karega kyunki port 5000 exposed hai
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;