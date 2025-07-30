import axios from 'axios';

// Get the hostname from the browser's current URL
const hostname = window.location.hostname;

// Dynamically determine the API base URL
let API_BASE_URL;

if (hostname === 'localhost' || hostname === '127.0.0.1') {
  // --- DEVELOPMENT ON LOCAL MACHINE ---
  // We are on the same machine as the server, so use the .env variable.
  // This allows us to keep the configuration from the .env file for local dev.
  API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
} else {
  // --- ACCESS FROM MOBILE OR ANOTHER COMPUTER ON THE NETWORK ---
  // We are on a different device, so use the device's IP address to connect.
  // This constructs the URL like: http://192.168.1.15:8000
  API_BASE_URL = `http://${hostname}:8000`;
}

// Create a new instance of axios with the dynamically configured base URL
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`, // All requests will be prefixed with /api
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;