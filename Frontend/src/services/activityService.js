import { http } from '../api/http'

export const activityService = {
  async favorites() {
    return http.get('/api/favorites')
  },

  async recent() {
    return http.get('/api/recent')
  },
}
