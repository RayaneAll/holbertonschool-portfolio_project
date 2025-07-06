// Ce fichier gère la configuration Axios pour les requêtes API
import axios from 'axios';

// Création de l'instance Axios avec l'URL de base
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ajout du token JWT à chaque requête si présent
api.interceptors.request.use(
  (config) => {
  const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Gestion des erreurs de réponse, notamment l'expiration du token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export de l'instance Axios configurée
export default api;
