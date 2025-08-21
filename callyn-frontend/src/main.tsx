
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './context'
import ApiService from './context/services/apiService'
import App from './App.tsx'
import './index.css'

// Hydrate auth header from persisted token on app boot
try {
  const token = localStorage.getItem('token');
  if (token) ApiService.setToken(token);
} catch (_) {}

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
