import { http, requestWithFallback } from '../api/http'

const specBase = (workspaceId) => `/api/workspace/${workspaceId}/members`
const currentBase = (workspaceId) => `/api/invite/workspaces/${workspaceId}/invites`

export const memberService = {
  async invite(workspaceId, payload) {
    return requestWithFallback(
      () => http.post(specBase(workspaceId), payload),
      () => http.post(currentBase(workspaceId), payload),
    )
  },

  async list(workspaceId) {
    return requestWithFallback(
      () => http.get(specBase(workspaceId)),
      () => http.get(currentBase(workspaceId)),
    )
  },

  async updateRole(workspaceId, memberId, payload) {
    return requestWithFallback(
      () => http.put(`${specBase(workspaceId)}/${memberId}`, payload),
      () => http.put(`${currentBase(workspaceId)}/${memberId}`, payload),
    )
  },

  async remove(workspaceId, memberId) {
    return requestWithFallback(
      () => http.delete(`${specBase(workspaceId)}/${memberId}`),
      () => http.delete(`${currentBase(workspaceId)}/${memberId}`),
    )
  },
}
