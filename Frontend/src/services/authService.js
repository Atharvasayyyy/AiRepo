import { http, removeToken, setToken } from '../api/http'

export const authService = {
  async register(payload) {
    return http.post('/api/auth/register', payload)
  },

  async login(payload) {
    const data = await http.post('/api/auth/login', payload)
    if (data?.token) {
      setToken(data.token)
    }
    return data
  },

  async logout() {
    try {
      return await http.post('/api/auth/logout')
    } finally {
      removeToken()
    }
  },

  async profile() {
    return http.get('/api/auth/profile')
  },

  async updateProfile(payload) {
    const data = await http.put('/api/auth/profile', payload)
    return data?.user || data
  },
}
