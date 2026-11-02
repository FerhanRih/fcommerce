import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios'

// 🔥 Automatically route all axios requests to Render in production, localhost in development
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Automatically attach auth token if available
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)