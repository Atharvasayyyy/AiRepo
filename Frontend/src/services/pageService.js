import { http, requestWithFallback } from '../api/http'

export const pageService = {
  async create(payload) {
    return requestWithFallback(
      () => http.post('/api/page', payload),
      () => http.post('/api/page/create', payload),
    )
  },

  async get(pageId) {
    return http.get(`/api/page/${pageId}`)
  },

  async listByWorkspace(workspaceId) {
    return http.get(`/api/page/workspace/${workspaceId}`)
  },

  async update(pageId, payload) {
    return http.put(`/api/page/${pageId}`, payload)
  },

  async remove(pageId) {
    return http.delete(`/api/page/${pageId}`)
  },

  async archive(pageId) {
    return requestWithFallback(
      () => http.post(`/api/page/${pageId}/archive`),
      () => http.post(`/api/page/archive/${pageId}`),
    )
  },

  async unarchive(pageId) {
    return requestWithFallback(
      () => http.post(`/api/page/${pageId}/unarchive`),
      () => http.post(`/api/page/unarchive/${pageId}`),
    )
  },

  async favorite(pageId) {
    return http.post(`/api/page/${pageId}/favorite`)
  },

  async unfavorite(pageId) {
    return http.delete(`/api/page/${pageId}/favorite`)
  },

  async trackRecent(pageId) {
    return requestWithFallback(
      () => http.post(`/api/recent/${pageId}`),
      () => http.post(`/api/page/${pageId}/recent`),
    )
  },
}
