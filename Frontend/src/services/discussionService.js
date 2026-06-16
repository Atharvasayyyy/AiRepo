import { http, requestWithFallback } from '../api/http'

const specBase = (workspaceId) => `/api/discussions/${workspaceId}`
const currentBase = (workspaceId) => `/api/dessesion/${workspaceId}`

export const discussionService = {
  async sendMessage(workspaceId, payload) {
    return requestWithFallback(
      () => http.post(`${specBase(workspaceId)}/messages`, payload),
      () => http.post(`${currentBase(workspaceId)}/messages`, payload),
    )
  },

  async getMessages(workspaceId) {
    return requestWithFallback(
      () => http.get(`${specBase(workspaceId)}/messages`),
      () => http.get(`${currentBase(workspaceId)}/messages`),
    )
  },

  async deleteMessage(workspaceId, messageId) {
    return requestWithFallback(
      () => http.delete(`/api/discussions/messages/${messageId}`),
      () => http.delete(`${currentBase(workspaceId)}/messages/${messageId}`),
    )
  },

  async pin(workspaceId, messageId) {
    return requestWithFallback(
      () => http.post(`/api/discussions/messages/${messageId}/pin`),
      () => http.post(`${currentBase(workspaceId)}/messages/${messageId}/pin`),
    )
  },

  async unpin(workspaceId, messageId) {
    return requestWithFallback(
      () => http.post(`/api/discussions/messages/${messageId}/unpin`),
      () => http.post(`${currentBase(workspaceId)}/messages/${messageId}/unpin`),
    )
  },

  async pinned(workspaceId) {
    return requestWithFallback(
      () => http.get(`${specBase(workspaceId)}/pinned`),
      () => http.get(`${currentBase(workspaceId)}/pinned`),
    )
  },

  async decisions(workspaceId) {
    return requestWithFallback(
      () => http.get(`${specBase(workspaceId)}/decisions`),
      () => http.get(`${currentBase(workspaceId)}/decisions`),
    )
  },
}
