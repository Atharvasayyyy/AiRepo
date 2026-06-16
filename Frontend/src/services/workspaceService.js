import { http, requestWithFallback } from '../api/http'

export const workspaceService = {
  async dashboard() {
    return http.get('/api/workspace/dashboard')
  },

  async create(payload) {
    return requestWithFallback(
      () => http.post('/api/workspace', payload),
      () => http.post('/api/workspace/create', payload),
    )
  },

  async get(workspaceId) {
    return http.get(`/api/workspace/${workspaceId}`)
  },

  async update(workspaceId, payload) {
    return http.put(`/api/workspace/${workspaceId}`, payload)
  },

  async remove(workspaceId) {
    return http.delete(`/api/workspace/${workspaceId}`)
  },
}
