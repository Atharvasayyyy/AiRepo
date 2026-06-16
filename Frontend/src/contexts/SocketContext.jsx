import { useCallback, useEffect, useMemo, useRef } from 'react'
import { createSocket } from '../services/socketService'
import { useAuth } from '../hooks/useAuth'
import { useWorkspace } from '../hooks/useWorkspace'
import { SocketContext } from './socketContextObject'

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const { setMessages, setOnlineUsers, setTypingUsers } = useWorkspace()
  const socketRef = useRef(null)

  useEffect(() => {
    if (!isAuthenticated) {
      socketRef.current?.disconnect()
      socketRef.current = null
      return undefined
    }

    const socket = createSocket()
    socketRef.current = socket
    socket.connect()

    socket.on('receive_message', (message) => {
      setMessages((current) => {
        if (current.some((item) => item._id && item._id === message?._id)) return current
        return [...current, message]
      })
    })
    socket.on('user_online', (user) => {
      setOnlineUsers((current) => (current.some((item) => (item._id || item.id) === (user?._id || user?.id)) ? current : [...current, user]))
    })
    socket.on('user_offline', (user) => {
      setOnlineUsers((current) => current.filter((item) => (item._id || item.id) !== (user?._id || user?.id)))
    })
    socket.on('typing', (user) => {
      setTypingUsers((current) => (current.some((item) => (item._id || item.id) === (user?._id || user?.id)) ? current : [...current, user]))
    })
    socket.on('stop_typing', (user) => {
      setTypingUsers((current) => current.filter((item) => (item._id || item.id) !== (user?._id || user?.id)))
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [isAuthenticated, setMessages, setOnlineUsers, setTypingUsers])

  const joinWorkspace = useCallback((workspaceId) => {
    socketRef.current?.emit('join_workspace', workspaceId)
  }, [])

  const leaveWorkspace = useCallback((workspaceId) => {
    socketRef.current?.emit('leave_workspace', workspaceId)
  }, [])

  const sendRealtimeMessage = useCallback((payload) => {
    socketRef.current?.emit('send_message', payload)
  }, [])

  const typing = useCallback((payload) => {
    socketRef.current?.emit('typing', payload)
  }, [])

  const stopTyping = useCallback((payload) => {
    socketRef.current?.emit('stop_typing', payload)
  }, [])

  const value = useMemo(
    () => ({
      joinWorkspace,
      leaveWorkspace,
      sendRealtimeMessage,
      typing,
      stopTyping,
    }),
    [joinWorkspace, leaveWorkspace, sendRealtimeMessage, stopTyping, typing],
  )

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}
