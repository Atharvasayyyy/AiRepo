import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { activityService } from '../services/activityService'
import { aiService } from '../services/aiService'
import { discussionService } from '../services/discussionService'
import { memberService } from '../services/memberService'
import { pageService } from '../services/pageService'
import { searchService } from '../services/searchService'
import { workspaceService } from '../services/workspaceService'
import { WorkspaceContext } from './workspaceContextObject'

function normalizeDashboard(data) {
  const workspaces = data?.workspaces || []
  const ownedWorkspaces = data?.ownedWorkspaces || workspaces
  return {
    ownedWorkspaces,
    sharedWorkspaces: data?.sharedWorkspaces || [],
    recentPages: data?.recentPages || [],
    recentDiscussions: data?.recentDiscussions || [],
    archivedPages: data?.archivedPages || [],
    favorites: data?.favorites || [],
  }
}

function mutationState(mutation) {
  return {
    loading: mutation.isPending,
    error: mutation.error?.message || '',
  }
}

export function WorkspaceProvider({ children }) {
  const queryClient = useQueryClient()
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('')
  const [selectedPageId, setSelectedPageId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const dashboardQuery = useQuery({
    queryKey: ['workspace-dashboard'],
    queryFn: workspaceService.dashboard,
  })

  const dashboard = normalizeDashboard(dashboardQuery.data)
  const allWorkspaces = [...dashboard.ownedWorkspaces, ...dashboard.sharedWorkspaces]
  const effectiveWorkspaceId = selectedWorkspaceId || allWorkspaces[0]?._id || ''

  const workspaceQuery = useQuery({
    queryKey: ['workspace', effectiveWorkspaceId],
    queryFn: () => workspaceService.get(effectiveWorkspaceId),
    enabled: Boolean(effectiveWorkspaceId),
  })

  const selectedWorkspace = workspaceQuery.data?.workspace || workspaceQuery.data || allWorkspaces.find((item) => item._id === effectiveWorkspaceId) || null

  const workspacePagesQuery = useQuery({
    queryKey: ['workspace-pages', effectiveWorkspaceId],
    queryFn: () => pageService.listByWorkspace(effectiveWorkspaceId),
    enabled: Boolean(effectiveWorkspaceId),
  })

  const pageQuery = useQuery({
    queryKey: ['page', selectedPageId],
    queryFn: () => pageService.get(selectedPageId),
    enabled: Boolean(selectedPageId),
  })

  const membersQuery = useQuery({
    queryKey: ['members', effectiveWorkspaceId],
    queryFn: () => memberService.list(effectiveWorkspaceId),
    enabled: Boolean(effectiveWorkspaceId),
  })

  const messagesQuery = useQuery({
    queryKey: ['messages', effectiveWorkspaceId],
    queryFn: () => discussionService.getMessages(effectiveWorkspaceId),
    enabled: Boolean(effectiveWorkspaceId),
  })

  const pinnedQuery = useQuery({
    queryKey: ['pinned-messages', effectiveWorkspaceId],
    queryFn: () => discussionService.pinned(effectiveWorkspaceId),
    enabled: Boolean(effectiveWorkspaceId),
  })

  const decisionsQuery = useQuery({
    queryKey: ['decisions', effectiveWorkspaceId],
    queryFn: () => discussionService.decisions(effectiveWorkspaceId),
    enabled: Boolean(effectiveWorkspaceId),
  })

  const searchQuery = useQuery({
    queryKey: ['search', searchTerm],
    queryFn: () => searchService.search(searchTerm),
    enabled: Boolean(searchTerm),
  })

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: activityService.favorites,
  })

  const recentQuery = useQuery({
    queryKey: ['recent-pages'],
    queryFn: activityService.recent,
  })

  const invalidateWorkspace = useCallback(
    async (workspaceId = effectiveWorkspaceId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['workspace-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] }),
        queryClient.invalidateQueries({ queryKey: ['workspace-pages', workspaceId] }),
        queryClient.invalidateQueries({ queryKey: ['members', workspaceId] }),
        queryClient.invalidateQueries({ queryKey: ['messages', workspaceId] }),
        queryClient.invalidateQueries({ queryKey: ['pinned-messages', workspaceId] }),
        queryClient.invalidateQueries({ queryKey: ['decisions', workspaceId] }),
      ])
    },
    [effectiveWorkspaceId, queryClient],
  )

  const createWorkspaceMutation = useMutation({
    mutationFn: workspaceService.create,
    onSuccess: async (data) => {
      const workspace = data?.workspace || data
      setSelectedWorkspaceId(workspace?._id || '')
      await invalidateWorkspace(workspace?._id)
    },
  })

  const updateWorkspaceMutation = useMutation({
    mutationFn: ({ workspaceId, payload }) => workspaceService.update(workspaceId, payload),
    onSuccess: async (_data, variables) => invalidateWorkspace(variables.workspaceId),
  })

  const deleteWorkspaceMutation = useMutation({
    mutationFn: workspaceService.remove,
    onSuccess: async () => {
      setSelectedWorkspaceId('')
      setSelectedPageId('')
      await invalidateWorkspace('')
    },
  })

  const createPageMutation = useMutation({
    mutationFn: pageService.create,
    onSuccess: async (data) => {
      const page = data?.page || data
      setSelectedPageId(page?._id || '')
      await invalidateWorkspace(page?.workspace?._id || page?.workspace)
    },
  })

  const favoritePageMutation = useMutation({
    mutationFn: ({ pageId, favorite }) => (favorite ? pageService.unfavorite(pageId) : pageService.favorite(pageId)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  const updatePageMutation = useMutation({
    mutationFn: ({ pageId, payload }) => pageService.update(pageId, payload),
    onSuccess: async (data, variables) => {
      const page = data?.page || data
      await queryClient.invalidateQueries({ queryKey: ['page', variables.pageId] })
      await invalidateWorkspace(page?.workspace?._id || page?.workspace || variables.payload.workspace)
    },
  })

  const deletePageMutation = useMutation({
    mutationFn: ({ pageId }) => pageService.remove(pageId),
    onSuccess: async (_data, variables) => {
      setSelectedPageId('')
      await invalidateWorkspace(variables.workspaceId)
    },
  })

  const archivePageMutation = useMutation({
    mutationFn: ({ pageId }) => pageService.archive(pageId),
    onSuccess: async (data, variables) => {
      const page = data?.page || data
      if (selectedPageId === variables.pageId) setSelectedPageId('')
      await invalidateWorkspace(page?.workspace?._id || page?.workspace || variables.workspaceId)
    },
  })

  const unarchivePageMutation = useMutation({
    mutationFn: ({ pageId }) => pageService.unarchive(pageId),
    onSuccess: async (data, variables) => {
      const page = data?.page || data
      await invalidateWorkspace(page?.workspace?._id || page?.workspace || variables.workspaceId)
    },
  })

  const inviteMutation = useMutation({
    mutationFn: ({ workspaceId, payload }) => memberService.invite(workspaceId, payload),
    onSuccess: async (_data, variables) => invalidateWorkspace(variables.workspaceId),
  })

  const updateMemberMutation = useMutation({
    mutationFn: ({ workspaceId, memberId, role }) => memberService.updateRole(workspaceId, memberId, { role }),
    onSuccess: async (_data, variables) => invalidateWorkspace(variables.workspaceId),
  })

  const removeMemberMutation = useMutation({
    mutationFn: ({ workspaceId, memberId }) => memberService.remove(workspaceId, memberId),
    onSuccess: async (_data, variables) => invalidateWorkspace(variables.workspaceId),
  })

  const sendMessageMutation = useMutation({
    mutationFn: ({ workspaceId, payload }) => discussionService.sendMessage(workspaceId, payload),
    onSuccess: async (_data, variables) => invalidateWorkspace(variables.workspaceId),
  })

  const deleteMessageMutation = useMutation({
    mutationFn: ({ workspaceId, messageId }) => discussionService.deleteMessage(workspaceId, messageId),
    onSuccess: async (_data, variables) => invalidateWorkspace(variables.workspaceId),
  })

  const pinMessageMutation = useMutation({
    mutationFn: ({ workspaceId, messageId, pinned }) => (pinned ? discussionService.unpin(workspaceId, messageId) : discussionService.pin(workspaceId, messageId)),
    onSuccess: async (_data, variables) => invalidateWorkspace(variables.workspaceId),
  })

  const aiMutation = useMutation({
    mutationFn: aiService.action,
    onSuccess: async (_data, variables) => {
      if (variables.workspaceId) await invalidateWorkspace(variables.workspaceId)
    },
  })

  const selectWorkspace = useCallback((workspace) => {
    setSelectedWorkspaceId(workspace?._id || workspace || '')
    setSelectedPageId('')
  }, [])

  const loadDashboard = useCallback(async () => {
    const data = await queryClient.fetchQuery({ queryKey: ['workspace-dashboard'], queryFn: workspaceService.dashboard })
    return normalizeDashboard(data)
  }, [queryClient])

  const value = useMemo(() => ({
    dashboard,
    selectedWorkspace,
    selectedWorkspaceId: effectiveWorkspaceId,
    selectedPage: pageQuery.data?.page || pageQuery.data || null,
    selectedPageId,
    workspacePages: workspacePagesQuery.data?.pages || workspacePagesQuery.data || [],
    favorites: favoritesQuery.data?.favorites || [],
    recentPages: (recentQuery.data?.recent || []).map((item) => ({ ...(item.page || item), viewedAt: item.viewedAt })),
    members: membersQuery.data?.members || [],
    messages: messagesQuery.data?.messages || [],
    pinnedMessages: pinnedQuery.data?.messages || [],
    decisions: decisionsQuery.data?.decisions || [],
    searchResults: searchQuery.data || null,
    onlineUsers: [],
    typingUsers: [],
    loading: {
      dashboard: dashboardQuery.isLoading,
      workspace: workspaceQuery.isLoading,
      workspacePages: workspacePagesQuery.isLoading,
      page: pageQuery.isLoading,
      members: membersQuery.isLoading,
      discussions: messagesQuery.isLoading || pinnedQuery.isLoading || decisionsQuery.isLoading,
      search: searchQuery.isLoading,
      favorites: favoritesQuery.isLoading,
      recent: recentQuery.isLoading,
      workspaceCreate: createWorkspaceMutation.isPending,
      workspaceUpdate: updateWorkspaceMutation.isPending,
      workspaceDelete: deleteWorkspaceMutation.isPending,
      pageCreate: createPageMutation.isPending,
      pageUpdate: updatePageMutation.isPending,
      pageDelete: deletePageMutation.isPending,
      pageArchive: archivePageMutation.isPending,
      pageUnarchive: unarchivePageMutation.isPending,
      invite: inviteMutation.isPending,
      memberRole: updateMemberMutation.isPending,
      memberRemove: removeMemberMutation.isPending,
      messageSend: sendMessageMutation.isPending,
      ai: aiMutation.isPending,
    },
    errors: {
      dashboard: dashboardQuery.error?.message || '',
      workspace: workspaceQuery.error?.message || '',
      workspacePages: workspacePagesQuery.error?.message || '',
      page: pageQuery.error?.message || '',
      members: membersQuery.error?.message || '',
      discussions: messagesQuery.error?.message || pinnedQuery.error?.message || decisionsQuery.error?.message || '',
      search: searchQuery.error?.message || '',
      favorites: favoritesQuery.error?.message || '',
      recent: recentQuery.error?.message || '',
      workspaceCreate: mutationState(createWorkspaceMutation).error,
      workspaceUpdate: mutationState(updateWorkspaceMutation).error,
      workspaceDelete: mutationState(deleteWorkspaceMutation).error,
      pageCreate: mutationState(createPageMutation).error,
      pageUpdate: mutationState(updatePageMutation).error,
      pageDelete: mutationState(deletePageMutation).error,
      invite: mutationState(inviteMutation).error,
      messageSend: mutationState(sendMessageMutation).error,
      ai: mutationState(aiMutation).error,
    },
    aiResult: aiMutation.data || null,
    setSelectedWorkspace: selectWorkspace,
    setSelectedPage: (page) => setSelectedPageId(page?._id || page || ''),
    setMessages: () => {},
    setOnlineUsers: () => {},
    setTypingUsers: () => {},
    loadDashboard,
    createWorkspace: (payload) => createWorkspaceMutation.mutateAsync(payload).then((data) => data?.workspace || data),
    loadWorkspace: (workspaceId) => queryClient.fetchQuery({ queryKey: ['workspace', workspaceId], queryFn: () => workspaceService.get(workspaceId) }).then((data) => data?.workspace || data),
    updateWorkspace: (workspaceId, payload) => updateWorkspaceMutation.mutateAsync({ workspaceId, payload }).then((data) => data?.workspace || data),
    deleteWorkspace: (workspaceId) => deleteWorkspaceMutation.mutateAsync(workspaceId),
    loadMembers: (workspaceId) => queryClient.fetchQuery({ queryKey: ['members', workspaceId], queryFn: () => memberService.list(workspaceId) }).then((data) => data?.members || []),
    inviteMember: (workspaceId, payload) => inviteMutation.mutateAsync({ workspaceId, payload }),
    updateMemberRole: (workspaceId, memberId, role) => updateMemberMutation.mutateAsync({ workspaceId, memberId, role }),
    removeMember: (workspaceId, memberId) => removeMemberMutation.mutateAsync({ workspaceId, memberId }),
    createPage: (payload) => createPageMutation.mutateAsync(payload).then((data) => data?.page || data),
    loadPage: (pageId) => {
      setSelectedPageId(pageId)
      return queryClient.fetchQuery({ queryKey: ['page', pageId], queryFn: () => pageService.get(pageId) }).then(async (data) => {
        await pageService.trackRecent(pageId)
        await queryClient.invalidateQueries({ queryKey: ['recent-pages'] })
        return data?.page || data
      })
    },
    loadWorkspacePages: (workspaceId) => queryClient.fetchQuery({ queryKey: ['workspace-pages', workspaceId], queryFn: () => pageService.listByWorkspace(workspaceId) }).then((data) => data?.pages || []),
    updatePage: (pageId, payload) => updatePageMutation.mutateAsync({ pageId, payload }).then((data) => data?.page || data),
    deletePage: (pageId, workspaceId = effectiveWorkspaceId) => deletePageMutation.mutateAsync({ pageId, workspaceId }),
    archivePage: (pageId, workspaceId = effectiveWorkspaceId) => archivePageMutation.mutateAsync({ pageId, workspaceId }),
    unarchivePage: (pageId, workspaceId = effectiveWorkspaceId) => unarchivePageMutation.mutateAsync({ pageId, workspaceId }),
    loadDiscussions: async (workspaceId) => {
      const [messageData, pinnedData, decisionData] = await Promise.all([
        queryClient.fetchQuery({ queryKey: ['messages', workspaceId], queryFn: () => discussionService.getMessages(workspaceId) }),
        queryClient.fetchQuery({ queryKey: ['pinned-messages', workspaceId], queryFn: () => discussionService.pinned(workspaceId) }),
        queryClient.fetchQuery({ queryKey: ['decisions', workspaceId], queryFn: () => discussionService.decisions(workspaceId) }),
      ])
      return { messages: messageData?.messages || [], pinnedMessages: pinnedData?.messages || [], decisions: decisionData?.decisions || [] }
    },
    sendMessage: (workspaceId, payload) => sendMessageMutation.mutateAsync({ workspaceId, payload }).then((data) => data?.message || data),
    deleteMessage: (workspaceId, messageId) => deleteMessageMutation.mutateAsync({ workspaceId, messageId }),
    pinMessage: (workspaceId, messageId, pinned) => pinMessageMutation.mutateAsync({ workspaceId, messageId, pinned }),
    runSearch: (query) => {
      setSearchTerm(query?.trim() || '')
      return queryClient.fetchQuery({ queryKey: ['search', query], queryFn: () => searchService.search(query) })
    },
    runAiAction: (payload) => aiMutation.mutateAsync(payload),
    toggleFavoritePage: (pageId, favorite) => favoritePageMutation.mutateAsync({ pageId, favorite }),
  }), [
    aiMutation,
    archivePageMutation,
    createPageMutation,
    createWorkspaceMutation,
    dashboard,
    dashboardQuery.error,
    dashboardQuery.isLoading,
    decisionsQuery.data,
    decisionsQuery.error,
    decisionsQuery.isLoading,
    deleteMessageMutation,
    deletePageMutation,
    deleteWorkspaceMutation,
    effectiveWorkspaceId,
    favoritePageMutation,
    favoritesQuery.data,
    favoritesQuery.error,
    favoritesQuery.isLoading,
    inviteMutation,
    loadDashboard,
    membersQuery.data,
    membersQuery.error,
    membersQuery.isLoading,
    messagesQuery.data,
    messagesQuery.error,
    messagesQuery.isLoading,
    pageQuery.data,
    pageQuery.error,
    pageQuery.isLoading,
    pinMessageMutation,
    pinnedQuery.data,
    pinnedQuery.error,
    pinnedQuery.isLoading,
    queryClient,
    removeMemberMutation,
    recentQuery.data,
    recentQuery.error,
    recentQuery.isLoading,
    searchQuery.data,
    searchQuery.error,
    searchQuery.isLoading,
    selectWorkspace,
    selectedPageId,
    selectedWorkspace,
    sendMessageMutation,
    unarchivePageMutation,
    updateMemberMutation,
    updatePageMutation,
    updateWorkspaceMutation,
    workspacePagesQuery.data,
    workspacePagesQuery.error,
    workspacePagesQuery.isLoading,
    workspaceQuery.error,
    workspaceQuery.isLoading,
  ])

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
