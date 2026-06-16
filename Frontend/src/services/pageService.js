import { http, requestWithFallback } from '../api/http'

export const pageService = {
  async create(payload) {
    return http.post('/api/page', payload)
  },

  async get(pageId) {
    return http.get(`/api/page/${pageId}`)
  },

  async update(pageId, payload) {
    return http.put(`/api/page/${pageId}`, payload)
  },

  async remove(pageId) {
    return http.delete(`/api/page/${pageId}`)
  },

  async archive(pageId) {
    return requestWithFallback(
      () => http.post(`/api/page/archive/${pageId}`),
      () => http.post(`/api/page/${pageId}/archive`),
    )
  },

  async unarchive(pageId) {
    return requestWithFallback(
      () => http.post(`/api/page/unarchive/${pageId}`),
      () => http.post(`/api/page/${pageId}/unarchive`),
    )
  },
}
