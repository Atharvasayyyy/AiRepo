import { http } from '../api/http'

export const aiService = {
  async action(payload) {
    return http.post('/api/ai/action', payload)
  },
}
