import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL
})

// Response interceptors
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Clear auth on unauthorized to avoid retry loops after refresh
      ApiService.setToken(null);
      try { localStorage.removeItem('token'); } catch (_) {}
      // Optional: toast for visibility in dev
      // toast.error('Session expired. Please log in again.');
    }
    return Promise.reject(error);
  }
)

class ApiService {
  static async get(endpoint, params = {}) {
    try {
      const response = await api.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error('GET request failed:', error);
      throw error;
    }
  }

  static async post(endpoint, data = {}) {
    try {
      const response = await api.post(endpoint, data);
      return response.data;
    } catch (error) {
      console.error('POST request failed:', error);
      throw error;
    }
  }

  static async patch(endpoint, data = {}) {
    try {
      const response = await api.patch(endpoint, data);
      return response.data;
    } catch (error) {
      console.error('PATCH request failed:', error);
      throw error;
    }
  }

  static async put(endpoint, data = {}) {
    try {
      const response = await api.put(endpoint, data);
      return response.data;
    } catch (error) {
      console.error('PUT request failed:', error);
      throw error;
    }
  }

  static async delete(endpoint, params = {}) {
    try {
      const response = await api.delete(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error('DELETE request failed:', error);
      throw error;
    }
  }

  static setToken(token: string | null) {
    if (!token) {
      delete api.defaults.headers['Authorization']
    } else {
      api.defaults.headers['Authorization'] = `Bearer ${token}`;
    }
  }
}

export default ApiService;
