import axios from 'axios';

// Get the base URL from the environment variable we set in frontend/.env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create a new instance of axios with a custom configuration
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`, // All requests will be prefixed with /api
  headers: {
    'Content-Type': 'application/json',
  },
});

// You can add interceptors here later for handling tokens or global errors
// For example:
// apiClient.interceptors.response.use(response => response, error => {
//   console.error("API call failed. ", error);
//   return Promise.reject(error);
// });

export default apiClient;