import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5001/api'

const api = axios.create({
  baseURL: baseURL.replace(/\/$/, ''),
  headers: {
    'Content-Type': 'application/json',
  },
})

export default api
export { api }
