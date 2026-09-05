import axios from 'axios';

// Automatically detect karega ki app local par chal rahi hai ya Cloud/EC2 par
const getBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  // Agar EC2 IP par hai, toh wahi IP aur port 5000 use karega
  return `http://${hostname}:5000/api`;
};

const API = axios.create({
  baseURL: getBaseUrl(),
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;