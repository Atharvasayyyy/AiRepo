import axios from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export const http = axios.create({
  baseURL: API_BASE_URL || '/',
  headers: {
    'Content-Type': 'application/json',
  },
})

export function getToken() {
  return localStorage.getItem('token') || ''
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('token', token)
  }
}

export function removeToken() {
  localStorage.removeItem('token')
}

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const data = error.response?.data
    const message =
      data?.message ||
      data?.error ||
      data?.errors?.[0]?.msg ||
      error.message ||
      'Request failed'

    const normalized = new Error(message)
    normalized.status = error.response?.status
    normalized.body = data
    throw normalized
  },
)

export async function requestWithFallback(primary, fallback) {
  try {
    return await primary()
  } catch (error) {
    if (!fallback || ![404, 405].includes(error.status)) {
      throw error
    }
    return fallback()
  }
}
