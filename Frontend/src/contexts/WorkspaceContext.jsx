import { useCallback, useMemo, useState } from 'react'
import { discussionService } from '../services/discussionService'
import { memberService } from '../services/memberService'
import { pageService } from '../services/pageService'
import { searchService } from '../services/searchService'
import { workspaceService } from '../services/workspaceService'
import { WorkspaceContext } from './workspaceContextObject'

function asArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.workspaces)) return value.workspaces
  if (Array.isArray(value?.ownedWorkspaces)) return value.ownedWorkspaces
  return []
}

export function WorkspaceProvider({ children }) {
  const [dashboard, setDashboard] = useState({
    ownedWorkspaces: [],
    sharedWorkspaces: [],
    recentPages: [],
    recentDiscussions: [],
    archivedPages: [],
    favorites: [],
  })
  const [selectedWorkspace, setSelectedWorkspace] = useState(null)
  const [selectedPage, setSelectedPage] = useState(null)
  const [members, setMembers] = useState([])
  const [messages, setMessages] = useState([])
  const [pinnedMessages, setPinnedMessages] = useState([])
  const [decisions, setDecisions] = useState([])
  const [searchResults, setSearchResults] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const [loading, setLoading] = useState({})
  const [errors, setErrors] = useState({})

  const setBusy = useCallback((key, value) => {
    setLoading((current) => ({ ...current, [key]: value }))
  }, [])

  const setFailure = useCallback((key, error) => {
    setErrors((current) => ({ ...current, [key]: error?.message || error || '' }))
  }, [])

  const run = useCallback(
    async (key, task) => {
      setBusy(key, true)
      setFailure(key, '')
      try {
        return await task()
      } catch (error) {
        setFailure(key, error)
        throw error
      } finally {
        setBusy(key, false)
      }
    },
    [setBusy, setFailure],
  )

  const loadDashboard = useCallback(async () => {
    return run('dashboard', async () => {
      const data = await workspaceService.dashboard()
      const workspaces = asArray(data)
      const nextDashboard = {
        ownedWorkspaces: data?.ownedWorkspaces || workspaces,
        sharedWorkspaces: data?.sharedWorkspaces || [],
        recentPages: data?.recentPages || [],
        recentDiscussions: data?.recentDiscussions || [],
        archivedPages: data?.archivedPages || [],
        favorites: data?.favorites || [],
      }
      setDashboard(nextDashboard)
      if (!selectedWorkspace && nextDashboard.ownedWorkspaces[0]) {
        setSelectedWorkspace(nextDashboard.ownedWorkspaces[0])
      }
      return nextDashboard
    })
  }, [run, selectedWorkspace])

  const createWorkspace = useCallback(
    async (payload) => {
      return run('workspaceCreate', async () => {
        const data = await workspaceService.create(payload)
        const workspace = data?.workspace || data
        await loadDashboard()
        setSelectedWorkspace(workspace)
        return workspace
      })
    },
    [loadDashboard, run],
  )

  const loadWorkspace = useCallback(
    async (workspaceId) => {
      return run('workspace', async () => {
        const data = await workspaceService.get(workspaceId)
        const workspace = data?.workspace || data
        setSelectedWorkspace(workspace)
        return workspace
      })
    },
    [run],
  )

  const updateWorkspace = useCallback(
    async (workspaceId, payload) => {
      return run('workspaceUpdate', async () => {
        const data = await workspaceService.update(workspaceId, payload)
        const workspace = data?.workspace || data
        setSelectedWorkspace(workspace)
        await loadDashboard()
        return workspace
      })
    },
    [loadDashboard, run],
  )

  const deleteWorkspace = useCallback(
    async (workspaceId) => {
      return run('workspaceDelete', async () => {
        await workspaceService.remove(workspaceId)
        setSelectedWorkspace(null)
        await loadDashboard()
      })
    },
    [loadDashboard, run],
  )

  const loadMembers = useCallback(
    async (workspaceId) => {
      if (!workspaceId) return []
      return run('members', async () => {
        const data = await memberService.list(workspaceId)
        const nextMembers = data?.members || data?.workspace?.members || []
        setMembers(nextMembers)
        return nextMembers
      })
    },
    [run],
  )

  const inviteMember = useCallback(
    async (workspaceId, payload) => {
      return run('invite', async () => {
        const data = await memberService.invite(workspaceId, payload)
        await loadMembers(workspaceId)
        return data
      })
    },
    [loadMembers, run],
  )

  const updateMemberRole = useCallback(
    async (workspaceId, memberId, role) => {
      return run('memberRole', async () => {
        const data = await memberService.updateRole(workspaceId, memberId, { role })
        await loadMembers(workspaceId)
        return data
      })
    },
    [loadMembers, run],
  )

  const removeMember = useCallback(
    async (workspaceId, memberId) => {
      return run('memberRemove', async () => {
        await memberService.remove(workspaceId, memberId)
        setMembers((current) => current.filter((member) => (member.user?._id || member.user || member._id) !== memberId))
      })
    },
    [run],
  )

  const createPage = useCallback(
    async (payload) => {
      return run('pageCreate', async () => {
        const data = await pageService.create(payload)
        const page = data?.page || data
        setSelectedPage(page)
        await loadDashboard()
        return page
      })
    },
    [loadDashboard, run],
  )

  const loadPage = useCallback(
    async (pageId) => {
      return run('page', async () => {
        const data = await pageService.get(pageId)
        const page = data?.page || data
        setSelectedPage(page)
        return page
      })
    },
    [run],
  )

  const updatePage = useCallback(
    async (pageId, payload) => {
      const data = await pageService.update(pageId, payload)
      const page = data?.page || data
      setSelectedPage(page)
      return page
    },
    [],
  )

  const deletePage = useCallback(
    async (pageId) => {
      return run('pageDelete', async () => {
        await pageService.remove(pageId)
        setSelectedPage(null)
        await loadDashboard()
      })
    },
    [loadDashboard, run],
  )

  const archivePage = useCallback(
    async (pageId) => {
      return run('pageArchive', async () => {
        const data = await pageService.archive(pageId)
        await loadDashboard()
        return data?.page || data
      })
    },
    [loadDashboard, run],
  )

  const unarchivePage = useCallback(
    async (pageId) => {
      return run('pageUnarchive', async () => {
        const data = await pageService.unarchive(pageId)
        await loadDashboard()
        return data?.page || data
      })
    },
    [loadDashboard, run],
  )

  const loadDiscussions = useCallback(
    async (workspaceId) => {
      if (!workspaceId) return []
      return run('discussions', async () => {
        const [messageData, pinnedData, decisionData] = await Promise.all([
          discussionService.getMessages(workspaceId),
          discussionService.pinned(workspaceId),
          discussionService.decisions(workspaceId),
        ])
        const nextMessages = messageData?.messages || []
        setMessages(nextMessages)
        setPinnedMessages(pinnedData?.messages || [])
        setDecisions(decisionData?.decisions || [])
        return nextMessages
      })
    },
    [run],
  )

  const sendMessage = useCallback(
    async (workspaceId, payload) => {
      const optimisticId = `optimistic-${Date.now()}`
      const optimisticMessage = {
        _id: optimisticId,
        ...payload,
        createdAt: new Date().toISOString(),
        optimistic: true,
      }
      setMessages((current) => [...current, optimisticMessage])
      try {
        const data = await discussionService.sendMessage(workspaceId, payload)
        const message = data?.message || data
        setMessages((current) => current.map((item) => (item._id === optimisticId ? message : item)))
        return message
      } catch (error) {
        setMessages((current) => current.filter((item) => item._id !== optimisticId))
        setFailure('messageSend', error)
        throw error
      }
    },
    [setFailure],
  )

  const deleteMessage = useCallback(
    async (workspaceId, messageId) => {
      const previous = messages
      setMessages((current) => current.filter((message) => message._id !== messageId))
      try {
        await discussionService.deleteMessage(workspaceId, messageId)
      } catch (error) {
        setMessages(previous)
        setFailure('messageDelete', error)
        throw error
      }
    },
    [messages, setFailure],
  )

  const pinMessage = useCallback(
    async (workspaceId, messageId, pinned) => {
      return run('pinMessage', async () => {
        const data = pinned ? await discussionService.unpin(workspaceId, messageId) : await discussionService.pin(workspaceId, messageId)
        await loadDiscussions(workspaceId)
        return data?.message || data
      })
    },
    [loadDiscussions, run],
  )

  const runSearch = useCallback(
    async (query) => {
      if (!query?.trim()) {
        setSearchResults(null)
        return null
      }
      return run('search', async () => {
        const data = await searchService.search(query.trim())
        setSearchResults(data)
        return data
      })
    },
    [run],
  )

  const value = useMemo(
    () => ({
      dashboard,
      selectedWorkspace,
      selectedPage,
      members,
      messages,
      pinnedMessages,
      decisions,
      searchResults,
      onlineUsers,
      typingUsers,
      loading,
      errors,
      setSelectedWorkspace,
      setSelectedPage,
      setMessages,
      setOnlineUsers,
      setTypingUsers,
      loadDashboard,
      createWorkspace,
      loadWorkspace,
      updateWorkspace,
      deleteWorkspace,
      loadMembers,
      inviteMember,
      updateMemberRole,
      removeMember,
      createPage,
      loadPage,
      updatePage,
      deletePage,
      archivePage,
      unarchivePage,
      loadDiscussions,
      sendMessage,
      deleteMessage,
      pinMessage,
      runSearch,
    }),
    [
      archivePage,
      createPage,
      createWorkspace,
      dashboard,
      decisions,
      deleteMessage,
      deletePage,
      deleteWorkspace,
      errors,
      inviteMember,
      loadDashboard,
      loadDiscussions,
      loadMembers,
      loadPage,
      loadWorkspace,
      loading,
      members,
      messages,
      onlineUsers,
      pinMessage,
      pinnedMessages,
      removeMember,
      runSearch,
      searchResults,
      selectedPage,
      selectedWorkspace,
      sendMessage,
      typingUsers,
      unarchivePage,
      updateMemberRole,
      updatePage,
      updateWorkspace,
    ],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
