import { http } from '../api/http'

export const searchService = {
  async search(query) {
    return http.get('/api/search', { params: { q: query } })
  },
}
