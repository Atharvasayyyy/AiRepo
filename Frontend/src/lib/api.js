const DEFAULT_API_BASE_URL = '/'

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '')
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const message = typeof data === 'string' ? data : data?.message || data?.error || 'Request failed'
    throw new Error(message)
  }

  return data
}

export function saveToken(token) {
  if (token) {
    localStorage.setItem('token', token)
  }
}

export function readToken() {
  return localStorage.getItem('token') || ''
}

export function clearToken() {
  localStorage.removeItem('token')
}