import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL

if (!baseURL) {
  throw new Error('VITE_API_URL is required')
}

export const api = axios.create({
  baseURL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase() ?? 'GET'

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    config.headers.set('X-Selo-Request', '1')
  }

  return config
})