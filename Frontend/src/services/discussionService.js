import { http } from '../api/http'

const base = (workspaceId) => `/api/discussion/${workspaceId}`

export const discussionService = {
  async sendMessage(workspaceId, payload) {
    return http.post(`${base(workspaceId)}/messages`, payload)
  },

  async getMessages(workspaceId) {
    return http.get(`${base(workspaceId)}/messages`)
  },

  async deleteMessage(workspaceId, messageId) {
    return http.delete(`/api/discussion/messages/${messageId}`)
  },

  async pin(workspaceId, messageId) {
    return http.post(`/api/discussion/messages/${messageId}/pin`)
  },

  async unpin(workspaceId, messageId) {
    return http.post(`/api/discussion/messages/${messageId}/unpin`)
  },

  async pinned(workspaceId) {
    return http.get(`${base(workspaceId)}/pinned`)
  },

  async decisions(workspaceId) {
    return http.get(`${base(workspaceId)}/decisions`)
  },
}
