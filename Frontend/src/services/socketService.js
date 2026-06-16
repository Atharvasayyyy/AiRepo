import { io } from 'socket.io-client'
import { getToken } from '../api/http'

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') || undefined

export function createSocket() {
  return io(SOCKET_URL, {
    autoConnect: false,
    auth: {
      token: getToken(),
    },
  })
}
