import { http, requestWithFallback } from '../api/http'

const base = (workspaceId) => `/api/invite/workspaces/${workspaceId}/invites`
const memberBase = (workspaceId) => `/api/workspace/${workspaceId}/members`

export const memberService = {
  async invite(workspaceId, payload) {
    return requestWithFallback(
      () => http.post(base(workspaceId), payload),
      () => http.post(memberBase(workspaceId), payload),
    )
  },

  async list(workspaceId) {
    return requestWithFallback(
      () => http.get(base(workspaceId)),
      () => http.get(memberBase(workspaceId)),
    )
  },

  async updateRole(workspaceId, memberId, payload) {
    return requestWithFallback(
      () => http.put(`${base(workspaceId)}/${memberId}`, payload),
      () => http.put(`${memberBase(workspaceId)}/${memberId}`, payload),
    )
  },

  async remove(workspaceId, memberId) {
    return requestWithFallback(
      () => http.delete(`${base(workspaceId)}/${memberId}`),
      () => http.delete(`${memberBase(workspaceId)}/${memberId}`),
    )
  },
}
