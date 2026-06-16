import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { pageHtml } from './pageHtml'
import { useAuth } from './hooks/useAuth'
import { useSocket } from './hooks/useSocket'
import { useWorkspace } from './hooks/useWorkspace'
import { useAutosave } from './hooks/useAutosave'
import { useDebouncedValue } from './hooks/useDebouncedValue'

const routes = {
  '/': 'landing',
  '/login': 'login',
  '/signup': 'signup',
  '/dashboard': 'dashboard',
  '/playground': 'dashboard',
  '/workspaces/new': 'playground',
  '/pages/new': 'playground',
}

function getRoute(pathname = '/') {
  if (pathname.startsWith('/workspaces/')) return 'playground'
  if (pathname.startsWith('/pages/')) return 'playground'
  if (pathname.startsWith('/profile')) return 'profile'
  return routes[pathname] ?? 'landing'
}

function App() {
  const location = useLocation()
  const routerNavigate = useNavigate()
  const page = getRoute(location.pathname)
  const path = location.pathname

  const navigate = useCallback((href) => {
    routerNavigate(href)
    window.scrollTo(0, 0)
  }, [routerNavigate])

  const html = useMemo(() => pageHtml[page], [page])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', false)
    document.body.className =
      page === 'landing'
        ? 'bg-surface font-body-md text-on-surface overflow-x-hidden'
        : page === 'signup'
          ? 'signup-bg min-h-screen flex flex-col font-body-md text-on-surface transition-colors duration-300'
          : page === 'dashboard' || page === 'playground'
            ? 'bg-surface font-body-md text-on-surface overflow-hidden'
            : 'bg-background text-on-background min-h-screen flex flex-col font-body-md transition-colors duration-300'

    const title = {
      landing: 'DevHub | Organize Notes, Documents and Ideas',
      login: 'DevNotes - Sign In',
      signup: 'Sign Up | DevNotes',
      dashboard: 'DevNotes Dashboard',
      playground: 'DevNotes Workspace',
    }[page]
    document.title = title
  }, [page])

  useEffect(() => {
    const onClick = (event) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const anchor = target.closest('a')
      if (anchor) {
        const href = anchor.getAttribute('href')
        if (href && getRoute(href) !== 'landing') {
          event.preventDefault()
          navigate(href)
        }
        return
      }

      const button = target.closest('button')
      if (!button) return

      const text = button.textContent.replace(/\s+/g, ' ').trim()
      if (text === 'Login') {
        navigate('/login')
      }
      if (['Get Started', 'Get Started Free', 'Start For Free'].includes(text)) {
        navigate('/signup')
      }
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [navigate])

  usePageBehavior(page)

  return (
    <Routes>
      <Route path="/" element={<div dangerouslySetInnerHTML={{ __html: html }} />} />
      <Route path="/login" element={<LoginPage navigate={navigate} />} />
      <Route path="/signup" element={<RegisterPage navigate={navigate} />} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage navigate={navigate} /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Playground path={path} navigate={navigate} /></ProtectedRoute>} />
      <Route path="/playground" element={<ProtectedRoute><Playground path={path} navigate={navigate} /></ProtectedRoute>} />
      <Route path="/workspaces/*" element={<ProtectedRoute><Playground path={path} navigate={navigate} /></ProtectedRoute>} />
      <Route path="/pages/*" element={<ProtectedRoute><Playground path={path} navigate={navigate} /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function usePageBehavior(page) {
  useEffect(() => {
    if (page === 'landing') return runLandingDemo()
    return undefined
  }, [page])
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-on-surface-variant">
        Loading workspace...
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-outline-variant/40 bg-white p-6 shadow-xl shadow-primary/5">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
            <span className="material-symbols-outlined">terminal</span>
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-on-surface-variant">{subtitle}</p>
          </div>
        </div>
        {children}
        {footer}
      </section>
    </main>
  )
}

function LoginPage({ navigate }) {
  const { login, loading, error } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setStatus('')
    try {
      await login(form)
      navigate('/dashboard')
    } catch (loginError) {
      setStatus(loginError.message || 'Login failed')
    }
  }

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Sign in to open your collaborative workspace."
      footer={<p className="mt-6 text-sm text-center text-on-surface-variant">New here? <button className="font-bold text-primary" type="button" onClick={() => navigate('/signup')}>Create account</button></p>}
    >
      <form className="space-y-4" onSubmit={submit}>
        <AppleInput label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <AppleInput label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
        <SubmitRow busy={loading} status={status || error} label="Login" />
      </form>
    </AuthShell>
  )
}

function RegisterPage({ navigate }) {
  const { register, loading, error } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [status, setStatus] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setStatus('')
    try {
      await register(form)
      setStatus('Account created. You can log in now.')
      navigate('/login')
    } catch (registerError) {
      setStatus(registerError.message || 'Registration failed')
    }
  }

  return (
    <AuthShell
      title="Create Account"
      subtitle="Start with a secure DevNotes profile."
      footer={<p className="mt-6 text-sm text-center text-on-surface-variant">Already registered? <button className="font-bold text-primary" type="button" onClick={() => navigate('/login')}>Login</button></p>}
    >
      <form className="space-y-4" onSubmit={submit}>
        <AppleInput label="Username" value={form.username} onChange={(username) => setForm({ ...form, username })} />
        <AppleInput label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <AppleInput label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
        <SubmitRow busy={loading} status={status || error} label="Create Account" />
      </form>
    </AuthShell>
  )
}

function ProfilePage({ navigate }) {
  const { user, updateProfile, logout, loading, error } = useAuth()
  const [form, setForm] = useState({ username: user?.username || '', email: user?.email || '', password: '' })
  const [status, setStatus] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setForm({ username: user?.username || '', email: user?.email || '', password: '' })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [user])

  const submit = async (event) => {
    event.preventDefault()
    setStatus('')
    try {
      await updateProfile({
        username: form.username,
        email: form.email,
        ...(form.password ? { password: form.password } : {}),
      })
      setStatus('Profile updated.')
    } catch (profileError) {
      setStatus(profileError.message || 'Profile update failed')
    }
  }

  return (
    <AuthShell
      title="Profile Settings"
      subtitle="Update your account details."
      footer={
        <div className="mt-6 flex items-center justify-between text-sm">
          <button className="font-bold text-primary" type="button" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
          <button className="font-bold text-[#b42318]" type="button" onClick={async () => { await logout(); navigate('/login') }}>Logout</button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        <AppleInput label="Username" value={form.username} onChange={(username) => setForm({ ...form, username })} />
        <AppleInput label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <AppleInput label="New Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
        <SubmitRow busy={loading} status={status || error} label="Update Profile" />
      </form>
    </AuthShell>
  )
}

function runLandingDemo() {
  const elements = {
    cursor: document.getElementById('mock-cursor'),
    sidebar1: document.getElementById('sidebar-note-1'),
    sidebar2: document.getElementById('sidebar-note-2'),
    title: document.getElementById('editor-title'),
    heading: document.getElementById('editor-heading'),
    para: document.getElementById('editor-paragraph'),
    code: document.getElementById('editor-code'),
    codeContent: document.getElementById('code-content'),
    aiPanel: document.getElementById('ai-panel'),
    aiQuery: document.getElementById('ai-query'),
    aiResponseCont: document.getElementById('ai-response-container'),
    aiResponseText: document.getElementById('ai-response-text'),
    shareBtn: document.getElementById('share-btn'),
    collaborators: document.getElementById('collaborators'),
  }
  let cancelled = false
  const timers = []
  const wait = (ms) =>
    new Promise((resolve) => {
      const timer = window.setTimeout(resolve, ms)
      timers.push(timer)
    })

  const resetDemo = () => {
    Object.values(elements).forEach((el) => {
      if (!el) return
      el.classList.remove('typing', 'active', 'glow', 'opacity-100', 'cursor-blink')
      if (['DIV', 'H2', 'PRE'].includes(el.tagName)) {
        if (el.classList.contains('typewriter')) {
          el.textContent = ''
        } else if (!el.classList.contains('browser-mockup')) {
          el.style.opacity = '0'
        }
      }
    })
    if (elements.cursor) {
      elements.cursor.style.opacity = '0'
      elements.cursor.style.transform = 'translate(400px, 300px)'
    }
  }

  const runDemo = async () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    resetDemo()
    await wait(500)
    if (cancelled || !elements.cursor) return
    elements.cursor.style.opacity = '1'
    elements.cursor.style.transform = 'translate(100px, 60px)'

    await wait(600)
    if (cancelled) return
    elements.sidebar1.textContent = 'DSA Notes'
    elements.sidebar1.classList.add('typing', 'cursor-blink')

    await wait(1200)
    if (cancelled) return
    elements.sidebar2.textContent = 'Arrays & Two Pointers'
    elements.sidebar2.classList.add('typing', 'cursor-blink')
    elements.sidebar1.classList.remove('cursor-blink')

    await wait(500)
    if (cancelled) return
    elements.title.textContent = 'Arrays & Two Pointers'
    elements.title.style.opacity = '1'

    await wait(1000)
    if (cancelled) return
    elements.heading.textContent = 'Key Concept'
    elements.heading.style.opacity = '1'

    await wait(500)
    if (cancelled) return
    elements.para.textContent =
      'The two-pointer technique is a powerful optimization for searching pairs in sorted arrays.'
    elements.para.classList.add('typing')

    await wait(1200)
    if (cancelled) return
    elements.codeContent.textContent =
      'function findPair(arr, target) {\n  let left = 0, right = arr.length - 1;\n  while(left < right) { ... }\n}'
    elements.code.style.opacity = '1'

    await wait(1000)
    if (cancelled) return
    elements.aiPanel.classList.add('active')

    await wait(600)
    if (cancelled) return
    elements.aiQuery.textContent = 'Summarize this note'
    elements.aiQuery.classList.add('typing', 'cursor-blink')

    await wait(1500)
    if (cancelled) return
    elements.aiResponseCont.style.opacity = '1'
    elements.aiResponseText.textContent =
      'This note covers the O(n) two-pointer strategy for array traversal and pair matching.'
    elements.aiResponseText.classList.add('typing')

    await wait(2000)
    if (cancelled) return
    elements.aiPanel.classList.remove('active')

    await wait(500)
    if (cancelled) return
    elements.shareBtn.classList.add('glow')
    elements.collaborators.style.opacity = '1'

    await wait(2000)
    if (!cancelled) runDemo()
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0')
          entry.target.classList.remove('translate-y-10', 'opacity-0')
        }
      })
    },
    { threshold: 0.1 },
  )

  document.querySelectorAll('.group, .browser-mockup, .bg-white').forEach((el) => {
    if (!el.classList.contains('browser-mockup')) {
      el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-10')
      observer.observe(el)
    }
  })

  runDemo()

  return () => {
    cancelled = true
    timers.forEach((timer) => window.clearTimeout(timer))
    observer.disconnect()
  }
}

const workspaceRoutes = [
  { method: 'POST', label: 'Create Workspace', href: '/workspaces/new' },
  { method: 'GET', label: 'Dashboard', href: '/dashboard' },
  { method: 'GET', label: 'Get Workspace By Id', href: '/workspaces/select' },
  { method: 'DEL', label: 'Delete Workspace', href: '/workspaces/delete' },
]

const pageRoutes = [
  { method: 'POST', label: 'Create Page', href: '/pages/new' },
  { method: 'GET', label: 'Get Page By Id', href: '/pages/select' },
  { method: 'PUT', label: 'Update Page', href: '/pages/edit' },
  { method: 'DEL', label: 'Delete Page', href: '/pages/delete' },
  { method: 'POST', label: 'Archive Page', href: '/pages/archive' },
  { method: 'POST', label: 'Unarchive Page', href: '/pages/unarchive' },
]

const initialWorkspace = {
  name: 'My Workspace',
  description: 'Project workspace',
  members: [],
}

const initialPage = {
  title: 'First Page',
  content: 'Page content goes here',
  workspace: '{{workspaceId}}',
  
}

function Playground({ path, navigate }) {
  const { user, logout: authLogout } = useAuth()
  const {
    dashboard,
    selectedWorkspace,
    selectedPage,
    members,
    messages,
    pinnedMessages,
    decisions,
    onlineUsers,
    typingUsers,
    loading,
    errors,
    setSelectedWorkspace,
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
    searchResults,
  } = useWorkspace()
  const { joinWorkspace, leaveWorkspace, sendRealtimeMessage, typing, stopTyping } = useSocket()
  const [workspace, setWorkspace] = useState(initialWorkspace)
  const [pageForm, setPageForm] = useState(initialPage)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('')
  const [pageId, setPageId] = useState('')
  const [status, setStatusMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [modal, setModal] = useState(null)
  const mode = getPlaygroundMode(path)
  const workspaceList = dashboard.ownedWorkspaces || []
  const sharedWorkspaces = dashboard.sharedWorkspaces || []
  const activeWorkspace = selectedWorkspace || workspaceList.find((item) => getId(item) === selectedWorkspaceId) || workspaceList[0] || null
  const activeWorkspaceId = getId(activeWorkspace) || selectedWorkspaceId
  const activeDoc = {
    workspaceName: activeWorkspace?.name || 'Workspace',
    pageTitle: selectedPage?.title || activeWorkspace?.name || 'Untitled',
    pageContent: selectedPage?.content || activeWorkspace?.description || 'Create a workspace and a page to start writing.',
    createdBy: selectedPage?.createdBy,
    modifiedBy: selectedPage?.modifiedBy,
    updatedAt: selectedPage?.updatedAt || activeWorkspace?.updatedAt,
  }

  const savePage = useCallback(
    async (nextPage) => {
      if (!pageId) return null
      return updatePage(pageId, {
        title: nextPage.title,
        content: nextPage.content,
        workspace: nextPage.workspace || activeWorkspaceId,
      })
    },
    [activeWorkspaceId, pageId, updatePage],
  )
  const autosave = useAutosave(pageForm, savePage, Boolean(pageId && mode === 'dashboard'))

  const refreshDashboard = useCallback(async () => {
    try {
      const nextDashboard = await loadDashboard()
      const nextWorkspace = nextDashboard.ownedWorkspaces?.[0] || nextDashboard.sharedWorkspaces?.[0] || null
      if (nextWorkspace && !activeWorkspaceId) {
        setSelectedWorkspaceId(getId(nextWorkspace))
        setSelectedWorkspace(nextWorkspace)
      }
    } catch (error) {
      setStatusMessage(error.message || 'Unable to load dashboard.')
    }
  }, [activeWorkspaceId, loadDashboard, setSelectedWorkspace])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshDashboard()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [refreshDashboard])

  useEffect(() => {
    if (!activeWorkspaceId) return undefined
    joinWorkspace(activeWorkspaceId)
    void loadMembers(activeWorkspaceId)
    void loadDiscussions(activeWorkspaceId)
    return () => leaveWorkspace(activeWorkspaceId)
  }, [activeWorkspaceId, joinWorkspace, leaveWorkspace, loadDiscussions, loadMembers])

  useEffect(() => {
    if (!path.startsWith('/workspaces/') || path.includes('/new')) return
    const workspaceId = path.split('/')[2]
    if (workspaceId && workspaceId !== 'select' && workspaceId !== 'delete') {
      const timer = window.setTimeout(() => {
        setSelectedWorkspaceId(workspaceId)
        void loadWorkspace(workspaceId)
      }, 0)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [loadWorkspace, path])

  useEffect(() => {
    if (!path.startsWith('/pages/') || path.includes('/new')) return
    const nextPageId = path.split('/')[2]
    if (nextPageId && !['select', 'edit', 'delete', 'archive', 'unarchive'].includes(nextPageId)) {
      const timer = window.setTimeout(() => {
        setPageId(nextPageId)
        void loadPage(nextPageId)
      }, 0)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [loadPage, path])

  useEffect(() => {
    if (selectedPage) {
      const timer = window.setTimeout(() => {
        setPageId(getId(selectedPage))
        setPageForm({
          title: selectedPage.title || '',
          content: selectedPage.content || '',
          workspace: getId(selectedPage.workspace) || activeWorkspaceId,
        })
      }, 0)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [activeWorkspaceId, selectedPage])

  const logout = async () => {
    await authLogout()
    navigate('/login')
  }

  const submitWorkspace = async (event) => {
    event.preventDefault()
    setBusy(true)
    setStatusMessage('')
    try {
      const created = await createWorkspace(workspace)
      const nextId = getId(created)
      setSelectedWorkspaceId(nextId)
      setPageForm((current) => ({ ...current, workspace: nextId || '{{workspaceId}}' }))
      setStatusMessage('Workspace created.')
      navigate('/dashboard')
    } catch (error) {
      setStatusMessage(error.message || 'Workspace request failed.')
    } finally {
      setBusy(false)
    }
  }

  const submitPage = async (event) => {
    event.preventDefault()
    setBusy(true)
    setStatusMessage('')
    try {
      const payload = {
        ...pageForm,
        workspace: pageForm.workspace === '{{workspaceId}}' ? activeWorkspaceId : pageForm.workspace,
      }
      const created = await createPage(payload)
      setPageId(getId(created))
      setStatusMessage('Page created.')
      navigate('/dashboard')
    } catch (error) {
      setStatusMessage(error.message || 'Page request failed.')
    } finally {
      setBusy(false)
    }
  }

  const runRouteAction = async () => {
    setBusy(true)
    setStatusMessage('')
    try {
      if (path === '/workspaces/select') {
        if (!activeWorkspaceId) throw new Error('Select a workspace first.')
        await loadWorkspace(activeWorkspaceId)
        setStatusMessage('Workspace loaded.')
      }
      if (path === '/workspaces/delete') {
        if (!activeWorkspaceId) throw new Error('Select a workspace first.')
        await deleteWorkspace(activeWorkspaceId)
        setStatusMessage('Workspace deleted.')
      }
      if (path === '/pages/select') {
        if (!pageId) throw new Error('Create a page first.')
        await loadPage(pageId)
        setStatusMessage('Page loaded.')
      }
      if (path === '/pages/edit') {
        if (!pageId) throw new Error('Create a page first.')
        await updatePage(pageId, { ...pageForm, workspace: activeWorkspaceId })
        setStatusMessage('Page updated.')
      }
      if (path === '/pages/delete') {
        if (!pageId) throw new Error('Create a page first.')
        await deletePage(pageId)
        setStatusMessage('Page deleted.')
      }
      if (path === '/pages/archive') {
        if (!pageId) throw new Error('Create a page first.')
        await archivePage(pageId)
        setStatusMessage('Page archived.')
      }
      if (path === '/pages/unarchive') {
        if (!pageId) throw new Error('Create a page first.')
        await unarchivePage(pageId)
        setStatusMessage('Page restored.')
      }
    } catch (error) {
      setStatusMessage(error.message || 'Action failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleWorkspaceSelect = (nextWorkspace) => {
    const nextId = getId(nextWorkspace)
    setSelectedWorkspaceId(nextId)
    setSelectedWorkspace(nextWorkspace)
    setWorkspace({
      name: nextWorkspace.name || initialWorkspace.name,
      description: nextWorkspace.description || initialWorkspace.description,
      members: Array.isArray(nextWorkspace.members) ? nextWorkspace.members : [],
    })
    setPageForm((current) => ({ ...current, workspace: nextId }))
  }

  return (
    <div className="h-screen overflow-hidden bg-surface text-on-surface flex flex-col lg:flex-row">
      <WorkspaceSidebar
        path={path}
        navigate={navigate}
        activeDoc={activeDoc}
        ownedWorkspaces={workspaceList}
        sharedWorkspaces={sharedWorkspaces}
        recentPages={dashboard.recentPages}
        archivedPages={dashboard.archivedPages}
        favorites={dashboard.favorites}
        user={user}
        onLogout={logout}
        onSearch={runSearch}
        searchResults={searchResults}
        onOpenModal={setModal}
        onSelectWorkspace={handleWorkspaceSelect}
      />
      <main className="flex-1 min-w-0 flex flex-col bg-white">
        <WorkspaceTopbar activeDoc={activeDoc} user={user} onlineUsers={onlineUsers} autosave={autosave} onLogout={logout} onProfile={() => navigate('/profile')} />
        {mode === 'workspace-new' && (
          <WorkspaceCreatePanel workspace={workspace} onChange={setWorkspace} onSubmit={submitWorkspace} busy={busy || loading.workspaceCreate} status={status || errors.workspaceCreate} />
        )}
        {mode === 'page-new' && (
          <PageCreatePanel
            pageForm={pageForm}
            workspaceList={workspaceList}
            workspaceId={activeWorkspaceId}
            onChange={setPageForm}
            onWorkspaceSelect={(id) => {
              setSelectedWorkspaceId(id)
              setPageForm((current) => ({ ...current, workspace: id }))
            }}
            onSubmit={submitPage}
            busy={busy || loading.pageCreate}
            status={status || errors.pageCreate}
          />
        )}
        {mode === 'action' && (
          <RouteActionPanel path={path} workspaceId={activeWorkspaceId} pageId={pageId} busy={busy} status={status} onRun={runRouteAction} />
        )}
        {mode === 'dashboard' && (
          <DashboardHome
            activeDoc={activeDoc}
            pageForm={pageForm}
            onPageChange={setPageForm}
            loading={loading.dashboard}
            selectedWorkspace={activeWorkspace}
            workspaceList={workspaceList}
            sharedWorkspaces={sharedWorkspaces}
            recentPages={dashboard.recentPages}
            recentDiscussions={dashboard.recentDiscussions}
            selectedWorkspaceId={activeWorkspaceId}
            navigate={navigate}
            onRefresh={refreshDashboard}
            onSelectWorkspace={handleWorkspaceSelect}
            onOpenModal={setModal}
            onDeletePage={() => pageId && deletePage(pageId)}
            onArchivePage={() => pageId && archivePage(pageId)}
            onUnarchivePage={() => pageId && unarchivePage(pageId)}
            autosave={autosave}
          />
        )}
      </main>
      <WorkspaceAiPanel
        workspaceId={activeWorkspaceId}
        onPrompt={async (prompt) => {
          if (!activeWorkspaceId) return
          const message = await sendMessage(activeWorkspaceId, { content: prompt, type: 'message' })
          sendRealtimeMessage({ workspaceId: activeWorkspaceId, message })
        }}
      />
      <DiscussionDrawer
        workspaceId={activeWorkspaceId}
        messages={messages}
        pinnedMessages={pinnedMessages}
        decisions={decisions}
        typingUsers={typingUsers}
        currentUser={user}
        onSend={async (payload) => {
          const message = await sendMessage(activeWorkspaceId, payload)
          sendRealtimeMessage({ workspaceId: activeWorkspaceId, message })
        }}
        onDelete={(messageId) => deleteMessage(activeWorkspaceId, messageId)}
        onPin={(messageId, pinned) => pinMessage(activeWorkspaceId, messageId, pinned)}
        onTyping={() => typing({ workspaceId: activeWorkspaceId, user })}
        onStopTyping={() => stopTyping({ workspaceId: activeWorkspaceId, user })}
      />
      <WorkspaceModals
        modal={modal}
        onClose={() => setModal(null)}
        workspace={activeWorkspace}
        members={members}
        busy={loading}
        errors={errors}
        onCreateWorkspace={createWorkspace}
        onUpdateWorkspace={updateWorkspace}
        onDeleteWorkspace={deleteWorkspace}
        onInviteMember={inviteMember}
        onUpdateMemberRole={updateMemberRole}
        onRemoveMember={removeMember}
      />
    </div>
  )
}
function getPlaygroundMode(path) {
  if (path === '/workspaces/new') return 'workspace-new'
  if (path === '/pages/new') return 'page-new'
  if (path === '/dashboard' || path === '/playground') return 'dashboard'
  return 'action'
}

function WorkspaceSidebar({
  path,
  navigate,
  activeDoc,
  ownedWorkspaces = [],
  sharedWorkspaces = [],
  recentPages = [],
  archivedPages = [],
  favorites = [],
  user,
  onLogout,
  onSearch,
  searchResults,
  onOpenModal,
  onSelectWorkspace,
}) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 400)

  useEffect(() => {
    if (debouncedQuery) {
      void onSearch?.(debouncedQuery)
    }
  }, [debouncedQuery, onSearch])

  return (
    <aside className="hidden lg:flex w-[280px] flex-shrink-0 bg-surface-container-low border-r border-outline-variant flex-col z-50">
      <div className="p-5 flex items-center justify-between">
        <button className="flex items-center gap-2 text-left" type="button" onClick={() => navigate('/dashboard')}>
          <span className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-[20px]">terminal</span>
          </span>
          <span className="font-bold text-lg tracking-tight text-on-surface">DevNotes</span>
        </button>
        <button className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors text-outline" type="button">
          <span className="material-symbols-outlined text-[20px]">keyboard_double_arrow_left</span>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-1 no-scrollbar">
        <div className="pb-4 border-b border-outline-variant/30 mb-4">
          <div className="px-3 py-2 rounded-lg bg-white border border-outline-variant/40">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-outline">search</span>
              <input className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
          </div>
          {searchResults && query && (
            <div className="mx-3 mt-2 rounded-lg border border-outline-variant/40 bg-white p-2 text-xs text-on-surface-variant">
              {Object.entries(searchResults).flatMap(([type, values]) => (Array.isArray(values) ? values.map((item) => ({ type, item })) : [])).slice(0, 4).map(({ type, item }) => (
                <button className="block w-full rounded px-2 py-1 text-left hover:bg-surface-container-low" key={`${type}-${getId(item) || item.title || item.name}`} type="button" onClick={() => navigate(type.includes('page') ? `/pages/${getId(item)}` : `/workspaces/${getId(item)}`)}>
                  <span className="font-bold capitalize">{type}</span> Â· {item.title || item.name || item.content}
                </button>
              ))}
            </div>
          )}
          <SidebarItem active={path === '/dashboard' || path === '/playground'} icon="home" label="Home" onClick={() => navigate('/dashboard')} />
          <SidebarItem active={false} icon="schedule" label={`Recent (${recentPages.length})`} />
          <SidebarItem active={false} icon="star" label={`Favorites (${favorites.length})`} />
        </div>

        <div className="space-y-1">
          <h3 className="px-3 text-[10px] font-bold text-outline uppercase tracking-widest mb-2 flex justify-between items-center">
            Owned Workspaces
            <button className="hover:text-primary" type="button" onClick={() => onOpenModal?.('create-workspace')}>
              <span className="material-symbols-outlined text-[14px]">add</span>
            </button>
          </h3>
          <div className="space-y-0.5">
            {ownedWorkspaces.length === 0 ? (
              <p className="px-3 py-2 text-xs text-outline">No owned workspaces yet.</p>
            ) : (
              ownedWorkspaces.map((workspace) => (
                <button
                  className="w-full flex items-center justify-between px-3 py-2 text-on-surface hover:bg-surface-container-high rounded-lg transition-colors group"
                  key={getId(workspace) || workspace.name}
                  type="button"
                  onClick={() => onSelectWorkspace?.(workspace)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-outline">keyboard_arrow_down</span>
                    <span className="material-symbols-outlined text-[18px] text-primary">folder_open</span>
                    <span className="text-sm font-semibold truncate">{workspace.name}</span>
                  </span>
                  <span className="hidden group-hover:flex items-center gap-1 text-outline">
                    <span className="material-symbols-outlined text-[16px] hover:text-primary" onClick={(event) => { event.stopPropagation(); navigate('/pages/new') }}>add</span>
                    <span className="material-symbols-outlined text-[16px] hover:text-primary" onClick={(event) => { event.stopPropagation(); onOpenModal?.('workspace-settings') }}>settings</span>
                  </span>
                </button>
              ))
            )}
            <div className="ml-8 space-y-0.5 mt-0.5">
              <button className="w-full flex items-center gap-3 px-3 py-1.5 bg-primary/5 text-primary rounded-lg text-sm font-bold" type="button" onClick={() => navigate('/dashboard')}>
                <span className="material-symbols-outlined text-[18px]">description</span>
                <span className="truncate">{activeDoc.pageTitle}</span>
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg text-sm transition-colors" type="button" onClick={() => onOpenModal?.('members')}>
                <span className="material-symbols-outlined text-[18px]">group</span>
                <span>Members</span>
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg text-sm transition-colors" type="button">
                <span className="material-symbols-outlined text-[18px]">forum</span>
                <span>Discussion</span>
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg text-sm transition-colors" type="button">
                <span className="material-symbols-outlined text-[18px]">gavel</span>
                <span>Decisions</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-1">
          <h3 className="px-3 text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Shared Workspaces</h3>
          {sharedWorkspaces.length === 0 ? (
            <p className="px-3 py-2 text-xs text-outline">No shared workspaces.</p>
          ) : (
            sharedWorkspaces.map((workspace) => (
              <button className="w-full flex items-center gap-2 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg text-sm transition-colors" key={getId(workspace) || workspace.name} type="button" onClick={() => onSelectWorkspace?.(workspace)}>
                <span className="material-symbols-outlined text-[18px]">keyboard_arrow_right</span>
                <span className="material-symbols-outlined text-[18px]">group</span>
                <span className="truncate">{workspace.name}</span>
              </button>
            ))
          )}
        </div>

        <div className="mt-6 space-y-1">
          <h3 className="px-3 text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Archived Pages</h3>
          {archivedPages.length === 0 ? <p className="px-3 py-2 text-xs text-outline">Nothing archived.</p> : archivedPages.map((page) => (
            <button className="w-full flex items-center gap-2 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg text-sm transition-colors" key={getId(page) || page.title} type="button" onClick={() => navigate(`/pages/${getId(page)}`)}>
              <span className="material-symbols-outlined text-[18px]">archive</span>
              <span className="truncate">{page.title}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-1">
          <h3 className="px-3 text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Future</h3>
          {['Meetings', 'Tasks', 'Presentations', 'Knowledge Base'].map((item) => (
            <button className="w-full flex items-center gap-2 px-3 py-2 text-outline rounded-lg text-sm" key={item} type="button">
              <span className="material-symbols-outlined text-[18px]">radio_button_unchecked</span>
              <span>{item}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-outline-variant/30">
        <div className="flex items-center gap-3 p-2 hover:bg-surface-container rounded-xl cursor-pointer transition-colors group">
          <div className="relative w-9 h-9 rounded-full border border-outline-variant bg-white flex items-center justify-center font-bold text-primary">
            {initials(user)}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{user?.username || 'User'}</p>
            <p className="text-[11px] text-outline font-medium truncate">{user?.email || 'Active'}</p>
          </div>
          <button className="text-on-surface-variant hover:text-primary" type="button" onClick={() => navigate('/profile')}>
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button className="text-on-surface-variant hover:text-[#b42318]" type="button" onClick={onLogout}>
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

function SidebarItem({ active, icon, label, method, shortcut, onClick }) {
  return (
    <button
      className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
        active ? 'bg-primary/5 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container-high'
      }`}
      type="button"
      onClick={onClick}
    >
      <span className="flex min-w-0 items-center gap-3">
        {icon ? (
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        ) : (
          <span className={`w-9 text-[10px] font-bold ${methodClass(method)}`}>{method}</span>
        )}
        <span className="truncate">{label}</span>
      </span>
      {shortcut && <span className="text-[10px] bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant/50 text-outline">{shortcut}</span>}
    </button>
  )
}

function WorkspaceTopbar({ activeDoc, user, onlineUsers = [], autosave, onLogout, onProfile }) {
  return (
    <header className="h-auto min-h-16 px-4 sm:px-6 border-b border-outline-variant bg-white/95 backdrop-blur-md sticky top-0 z-40 flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4 min-w-0">
        <button className="lg:hidden w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white" type="button">
          <span className="material-symbols-outlined text-[20px]">terminal</span>
        </button>
        <div className="min-w-0">
          <nav className="flex items-center text-[11px] text-outline font-bold uppercase tracking-wider">
            <span className="truncate">{activeDoc.workspaceName || 'Engineering'}</span>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-on-surface truncate">{activeDoc.pageTitle || 'Roadmap Q4'}</span>
          </nav>
          <div className="flex items-center gap-2 mt-0.5 min-w-0">
            <h1 className="text-lg font-bold text-on-surface truncate">{activeDoc.pageTitle || 'Product Roadmap Q4'}</h1>
            <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 bg-surface-container-high text-outline rounded font-label-mono">v2.4.0</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between md:justify-end gap-3">
        <div className="hidden lg:flex items-center gap-4 text-xs text-outline">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">history</span>
            <span>{activeDoc.updatedAt ? `Updated ${formatDate(activeDoc.updatedAt)}` : 'No updates yet'}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium border border-green-100">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 presence-pulse"></span>
            <span>{onlineUsers.length || 1} Online</span>
          </div>
          <span>{autosave?.saving ? 'Saving...' : autosave?.savedAt ? `Saved ${autosave.savedAt.toLocaleTimeString()}` : 'Saved'}</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 bg-surface-container-low p-1 rounded-lg">
          <button className="p-1.5 rounded hover:bg-white text-outline hover:text-primary transition-all" title="Tasks" type="button"><span className="material-symbols-outlined text-[18px]">task_alt</span></button>
          <button className="p-1.5 rounded hover:bg-white text-outline hover:text-primary transition-all" title="Meetings" type="button"><span className="material-symbols-outlined text-[18px]">video_call</span></button>
          <button className="p-1.5 rounded hover:bg-white text-outline hover:text-primary transition-all" title="Present" type="button"><span className="material-symbols-outlined text-[18px]">present_to_all</span></button>
        </div>
        <button className="px-4 py-1.5 bg-primary text-white font-bold rounded-lg hover:shadow-lg hover:shadow-primary/20 transition-all text-sm" type="button">
          Share
        </button>
        <button className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors" title="AI Actions" type="button">
          <span className="material-symbols-outlined">auto_awesome</span>
        </button>
        <button className="hidden sm:flex items-center gap-2 p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors" title="Profile" type="button" onClick={onProfile}>
          <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{initials(user)}</span>
        </button>
        <button className="lg:hidden p-2 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors" title="Logout" type="button" onClick={onLogout}>
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </header>
  )
}

function DashboardHome({
  activeDoc,
  pageForm,
  onPageChange,
  loading,
  workspaceList,
  sharedWorkspaces,
  recentPages,
  recentDiscussions,
  selectedWorkspaceId,
  selectedWorkspace,
  navigate,
  onRefresh,
  onSelectWorkspace,
  onOpenModal,
  onDeletePage,
  onArchivePage,
  onUnarchivePage,
  autosave,
}) {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth bg-white">
      <div className="max-w-[860px] mx-auto pt-6 sm:pt-8 px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8 p-3 bg-primary/5 rounded-xl border border-primary/10">
          <div className="flex items-center gap-3 min-w-0">
            <span className="material-symbols-outlined text-primary text-[20px]">bolt</span>
            <span className="text-xs font-medium text-primary/80 truncate">
              {loading ? 'Loading dashboard...' : autosave?.saving ? 'Autosaving page changes...' : autosave?.error || 'Workspace connected to live backend data.'}
            </span>
          </div>
          <button className="text-xs font-bold text-primary hover:underline self-start sm:self-auto" type="button" onClick={onRefresh}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="mb-10 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 mt-0.5">priority_high</span>
          <div>
            <h4 className="text-sm font-bold text-amber-900 uppercase tracking-tight">Recent Decisions</h4>
            <p className="text-sm text-amber-800">Open the discussion drawer to review pinned messages and decisions from the backend.</p>
          </div>
        </div>

        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex-1 min-w-0">
            <input
              className="w-full bg-transparent font-display-lg text-4xl sm:text-display-lg text-on-surface mb-3 leading-tight outline-none"
              value={pageForm.title || activeDoc.pageTitle || ''}
              onChange={(event) => onPageChange((current) => ({ ...current, title: event.target.value }))}
              placeholder="Untitled page"
            />
            <textarea
              className="w-full min-h-28 resize-none bg-transparent text-body-lg text-on-surface-variant leading-relaxed outline-none"
              value={pageForm.content || activeDoc.pageContent || ''}
              onChange={(event) => onPageChange((current) => ({ ...current, content: event.target.value }))}
              placeholder="Start writing..."
            />
            <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-outline">
              <span>Created by {displayUser(activeDoc.createdBy)}</span>
              <span>Modified by {displayUser(activeDoc.modifiedBy)}</span>
              <span>{activeDoc.updatedAt ? `Updated ${formatDate(activeDoc.updatedAt)}` : 'Not saved yet'}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-bold" type="button" onClick={() => onOpenModal('create-workspace')}>
              New Workspace
            </button>
            <button className="px-4 py-2.5 rounded-lg border border-outline-variant text-sm font-bold" type="button" onClick={() => navigate('/pages/new')}>
              New Page
            </button>
            <button className="px-3 py-2.5 rounded-lg border border-outline-variant text-sm font-bold" type="button" onClick={onArchivePage}>Archive</button>
            <button className="px-3 py-2.5 rounded-lg border border-outline-variant text-sm font-bold" type="button" onClick={onUnarchivePage}>Restore</button>
            <button className="px-3 py-2.5 rounded-lg border border-[#f1b5b5] text-[#b42318] text-sm font-bold" type="button" onClick={onDeletePage}>Delete</button>
          </div>
        </div>

        <div className="my-10 p-5 sm:p-8 bg-surface-container-low rounded-2xl border border-outline-variant/30 relative overflow-hidden group hover:shadow-xl hover:shadow-primary/5 transition-all">
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 flex-shrink-0">
              <span className="material-symbols-outlined">folder_open</span>
            </div>
            <div>
              <h4 className="font-bold text-on-surface text-lg mb-1.5">{selectedWorkspace?.name || 'No workspace selected'}</h4>
              <p className="text-on-surface-variant leading-relaxed">{selectedWorkspace?.description || 'Create or select a workspace to load pages, members, discussions, pinned messages, and decisions.'}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="text-xs font-bold bg-white px-3 py-2 rounded-lg border border-outline-variant" type="button" onClick={() => onOpenModal('workspace-settings')}>Workspace Settings</button>
                <button className="text-xs font-bold bg-white px-3 py-2 rounded-lg border border-outline-variant" type="button" onClick={() => onOpenModal('members')}>Members</button>
                <button className="text-xs font-bold bg-white px-3 py-2 rounded-lg border border-outline-variant" type="button" onClick={() => onOpenModal('delete-workspace')}>Delete Workspace</button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-12">
          <ListPanel title="Owned Workspaces" items={workspaceList} empty="No owned workspaces yet." render={(item) => (
            <button className={`w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-surface-container-low ${getId(item) === selectedWorkspaceId ? 'bg-primary/5 text-primary' : ''}`} type="button" onClick={() => onSelectWorkspace(item)}>
              <span className="min-w-0">
                <span className="block font-semibold truncate">{item.name || 'Untitled workspace'}</span>
                <span className="block text-sm text-on-surface-variant truncate">Owner: {displayUser(item.owner)} · Members: {item.members?.length || 0}</span>
                <span className="block text-xs text-outline">Updated {formatDate(item.updatedAt)}</span>
              </span>
              <span className="material-symbols-outlined text-outline">chevron_right</span>
            </button>
          )} />
          <ListPanel title="Shared Workspaces" items={sharedWorkspaces} empty="No shared workspaces." render={(item) => (
            <button className="w-full text-left p-4 hover:bg-surface-container-low" type="button" onClick={() => onSelectWorkspace(item)}>
              <span className="block font-semibold truncate">{item.name || 'Untitled workspace'}</span>
              <span className="block text-sm text-on-surface-variant truncate">Members: {item.members?.length || 0}</span>
            </button>
          )} />
          <ListPanel title="Recent Pages" items={recentPages} empty="No recent pages from backend." render={(item) => (
            <button className="w-full text-left p-4 hover:bg-surface-container-low" type="button" onClick={() => navigate(`/pages/${getId(item)}`)}>
              <span className="block font-semibold truncate">{item.title || 'Untitled page'}</span>
              <span className="block text-xs text-outline">Updated {formatDate(item.updatedAt)}</span>
            </button>
          )} />
          <ListPanel title="Recent Discussions" items={recentDiscussions} empty="No recent discussions from backend." render={(item) => (
            <div className="p-4">
              <span className="block font-semibold truncate">{displayUser(item.sender)}</span>
              <span className="block text-sm text-on-surface-variant truncate">{item.content}</span>
            </div>
          )} />
        </div>

        <div className="mb-20 rounded-2xl border border-outline-variant bg-[#0d1117] overflow-hidden shadow-2xl">
          <div className="bg-white/5 px-5 py-3 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/50"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/50"></span>
              </div>
              <span className="text-[11px] font-label-mono text-white/50 uppercase tracking-widest truncate">Live workspace state</span>
            </div>
          </div>
          <pre className="p-5 sm:p-8 font-label-mono text-sm leading-relaxed text-blue-300 overflow-x-auto"><code>{JSON.stringify({ workspaceId: selectedWorkspaceId || null, pageId: activeDoc.pageTitle || null }, null, 2)}</code></pre>
        </div>
      </div>
    </div>
  )
}
function WorkspaceCreatePanel({ workspace, onChange, onSubmit, busy, status }) {
  return (
    <FormShell title="Create workspace" subtitle="Only the fields your schema needs." method="POST">
      <form className="space-y-5" onSubmit={onSubmit}>
        <AppleInput label="Name" value={workspace.name} onChange={(name) => onChange({ ...workspace, name })} />
        <AppleTextarea label="Description" value={workspace.description} onChange={(description) => onChange({ ...workspace, description })} />
        <ReadonlyCode value={JSON.stringify(workspace, null, 2)} />
        <SubmitRow busy={busy} status={status} label="Create Workspace" />
      </form>
    </FormShell>
  )
}

function PageCreatePanel({ pageForm, workspaceList, workspaceId, onChange, onWorkspaceSelect, onSubmit, busy, status }) {
  const payload = {
    ...pageForm,
    workspace: pageForm.workspace === '{{workspaceId}}' ? workspaceId : pageForm.workspace,
  }

  return (
    <FormShell title="Create page" subtitle="Write the first page inside a workspace." method="POST">
      <form className="space-y-5" onSubmit={onSubmit}>
        <AppleInput label="Title" value={pageForm.title} onChange={(title) => onChange({ ...pageForm, title })} />
        <AppleTextarea label="Content" value={pageForm.content} onChange={(content) => onChange({ ...pageForm, content })} />
        {workspaceList.length > 0 ? (
          <label className="block">
            <span className="block text-xs font-semibold text-on-surface-variant mb-2">Workspace</span>
            <select
              className="w-full rounded-xl border border-[#e1e1e6] bg-white px-4 py-3 outline-none focus:border-[#1c1c1e]"
              value={payload.workspace || ''}
              onChange={(event) => {
                onChange({ ...pageForm, workspace: event.target.value })
                onWorkspaceSelect(event.target.value)
              }}
            >
              <option value="">Select workspace</option>
              {workspaceList.map((item) => (
                <option key={getId(item)} value={getId(item)}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <AppleInput label="Workspace" value={pageForm.workspace} onChange={(workspace) => onChange({ ...pageForm, workspace })} />
        )}
        <ReadonlyCode value={JSON.stringify(payload, null, 2)} />
        <SubmitRow busy={busy} status={status} label="Create Page" />
      </form>
    </FormShell>
  )
}

function RouteActionPanel({ path, workspaceId, pageId, busy, status, onRun }) {
  const route = [...workspaceRoutes, ...pageRoutes].find((item) => item.href === path)
  return (
    <FormShell title={route?.label || 'Route action'} subtitle="Attached route for the selected workspace or page." method={route?.method || 'GET'}>
      <div className="space-y-5">
        <ReadonlyCode value={JSON.stringify({ route: path, workspaceId, pageId }, null, 2)} />
        <SubmitRow busy={busy} status={status} label="Run Route" onClick={onRun} />
      </div>
    </FormShell>
  )
}

function FormShell({ title, subtitle, method, children }) {
  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
        <div className="mb-8">
          <span className={`inline-flex mb-4 text-[11px] font-bold ${methodClass(method)}`}>{method}</span>
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          <p className="mt-2 text-on-surface-variant">{subtitle}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low p-5 sm:p-6">{children}</div>
      </div>
    </div>
  )
}

function ListPanel({ title, items, empty, render }) {
  return (
    <section className="rounded-2xl border border-outline-variant/40 bg-white overflow-hidden">
      <div className="h-14 px-5 border-b border-outline-variant/30 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-xs text-outline">{items?.length || 0} total</span>
      </div>
      <div className="divide-y divide-outline-variant/20">
        {items?.length ? items.map((item) => <div key={getId(item) || item.title || item.name || item.content}>{render(item)}</div>) : <div className="p-5 text-sm text-on-surface-variant">{empty}</div>}
      </div>
    </section>
  )
}

function AppleInput({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-on-surface-variant mb-2">{label}</span>
      <input
        className="w-full rounded-xl border border-[#e1e1e6] bg-white px-4 py-3 outline-none focus:border-[#1c1c1e]"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function AppleTextarea({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-on-surface-variant mb-2">{label}</span>
      <textarea
        className="w-full min-h-32 rounded-xl border border-[#e1e1e6] bg-white px-4 py-3 outline-none resize-none focus:border-[#1c1c1e]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function ReadonlyCode({ value }) {
  return (
    <pre className="rounded-xl bg-[#f7f7f8] p-4 font-label-mono text-sm leading-6 text-on-surface overflow-x-auto">
      <code>{value}</code>
    </pre>
  )
}

function SubmitRow({ busy, status, label, onClick }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <button
        className="px-5 py-3 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-60"
        disabled={busy}
        type={onClick ? 'button' : 'submit'}
        onClick={onClick}
      >
        {busy ? 'Working...' : label}
      </button>
      {status && <p className="text-sm text-on-surface-variant">{status}</p>}
    </div>
  )
}

function WorkspaceAiPanel({ workspaceId, onPrompt }) {
  const [ask, setAsk] = useState('')
  const quickActions = [
    ['summarize', 'Summarize', '@AI summarize page'],
    ['playlist_add_check', 'Generate Tasks', '@AI generate tasks'],
    ['decision_making', 'Extract Decisions', '@AI extract decisions'],
    ['auto_fix_high', 'Rewrite Content', '@AI rewrite content'],
    ['edit_note', 'Create Meeting Notes', '@AI create meeting notes'],
    ['psychology', 'Explain Architecture', '@AI explain architecture'],
  ]

  const submitPrompt = async (prompt) => {
    if (!workspaceId || !prompt.trim()) return
    await onPrompt(prompt.trim())
    setAsk('')
  }

  return (
    <aside className="hidden xl:flex w-[350px] flex-shrink-0 bg-surface border-l border-outline-variant flex-col z-50">
      <div className="h-16 flex items-center justify-between px-6 border-b border-outline-variant bg-white">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <h3 className="font-bold text-on-surface">AI Workspace Assistant</h3>
        </div>
        <button className="p-1.5 hover:bg-surface-container rounded-full text-outline" type="button">
          <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        <div>
          <h4 className="text-[10px] font-bold text-outline uppercase tracking-widest mb-4">Quick Intelligence</h4>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(([icon, label, prompt]) => (
              <button className="flex flex-col items-start p-3 bg-white border border-outline-variant hover:border-primary hover:bg-primary/5 rounded-xl transition-all group" key={label} type="button" onClick={() => submitPrompt(prompt)}>
                <span className="material-symbols-outlined text-outline group-hover:text-primary mb-2">{icon}</span>
                <span className="text-xs font-bold">{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-outline uppercase tracking-widest">Active Context</h4>
          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[12px] text-white">smart_toy</span>
              </div>
              <span className="text-[11px] font-bold text-primary">AI Assistant</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              AI requests are sent as normal discussion messages with @AI prompts. Backend responses appear in the discussion stream as AI Assistant messages.
            </p>
          </div>
        </div>
      </div>
      <div className="p-6 border-t border-outline-variant bg-white">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-sm pointer-events-none">@AI</span>
          <input className="w-full pl-14 pr-12 py-3 bg-surface-container-low border border-outline-variant rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-medium transition-all" placeholder="Ask anything..." type="text" value={ask} onChange={(event) => setAsk(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void submitPrompt(`@AI ${ask}`) }} />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform" type="button" onClick={() => submitPrompt(`@AI ${ask}`)}>
            <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
          </button>
        </div>
        <p className="text-[10px] text-outline mt-3 text-center">All AI actions insert prompts into <span className="font-bold text-on-surface">Team Discussion</span>.</p>
      </div>
    </aside>
  )
}

function DiscussionDrawer({ workspaceId, messages = [], pinnedMessages = [], decisions = [], typingUsers = [], currentUser, onSend, onDelete, onPin, onTyping, onStopTyping }) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [replyTo, setReplyTo] = useState(null)

  const submit = async () => {
    if (!workspaceId || !content.trim()) return
    await onSend({ content: content.trim(), mentions: extractMentions(content), replyTo: replyTo?._id || null, type: content.startsWith('@AI') ? 'ai' : 'message' })
    setContent('')
    setReplyTo(null)
    onStopTyping?.()
  }

  return (
    <div className="hidden md:flex fixed bottom-6 right-6 xl:right-[380px] w-80 bg-white rounded-2xl shadow-2xl border border-outline-variant z-[60] flex-col max-h-[620px] overflow-hidden ai-glow">
      <button className="flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors w-full text-left" type="button" onClick={() => setOpen((value) => !value)}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined text-primary">forum</span>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">{messages.length}</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface">Team Discussion</h3>
            <p className="text-[10px] text-green-600 font-bold">{typingUsers.length ? `${typingUsers.map(displayUser).join(', ')} typing...` : workspaceId ? 'Live workspace room' : 'Select workspace'}</p>
          </div>
        </div>
        <span className="material-symbols-outlined text-outline">{open ? 'expand_more' : 'expand_less'}</span>
      </button>
      {open && (
        <div className="flex-1 flex flex-col border-t border-outline-variant min-h-0">
          <div className="p-4 space-y-4 overflow-y-auto no-scrollbar h-96 bg-surface-container-low/30">
            <SectionBlock title="Pinned" icon="push_pin" items={pinnedMessages} empty="No pinned messages." />
            <SectionBlock title="Decisions" icon="gavel" items={decisions} empty="No decisions yet." />
            {messages.length === 0 ? <p className="text-xs text-on-surface-variant">No messages yet.</p> : messages.map((message) => (
              <div className="flex gap-2" key={message._id || message.createdAt}>
                <div className={`${message.type === 'ai' || message.content?.startsWith('@AI') ? 'bg-primary' : 'bg-pink-500'} w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold`}>{message.type === 'ai' ? 'AI' : initials(message.sender || currentUser)}</div>
                <div className={`flex-1 p-3 rounded-2xl rounded-tl-none shadow-sm border border-outline-variant/30 ${message.type === 'ai' ? 'bg-primary/5' : 'bg-white'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[11px] font-bold text-on-surface">{message.type === 'ai' ? 'AI Assistant' : displayUser(message.sender || currentUser)}</p>
                    <span className="text-[10px] text-outline">{formatDate(message.createdAt)}</span>
                    {message.isPinned && <span className="text-[9px] font-bold text-primary">Pinned</span>}
                  </div>
                  {message.replyTo && <p className="mb-1 text-[10px] text-outline">Replying to {displayUser(message.replyTo.sender)}</p>}
                  <p className="text-[12px] text-on-surface-variant whitespace-pre-wrap">{message.content}</p>
                  <div className="mt-2 flex gap-2 text-[10px] font-bold text-outline">
                    <button type="button" onClick={() => setReplyTo(message)}>Reply</button>
                    <button type="button" onClick={() => onPin(message._id, message.isPinned)}>{message.isPinned ? 'Unpin' : 'Pin'}</button>
                    <button type="button" onClick={() => onDelete(message._id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-outline-variant bg-white space-y-2">
            {replyTo && <div className="text-[10px] text-outline flex justify-between"><span>Replying to {displayUser(replyTo.sender)}</span><button type="button" onClick={() => setReplyTo(null)}>Cancel</button></div>}
            <div className="flex items-center gap-2">
              <input className="flex-1 bg-surface-container px-3 py-2 rounded-xl text-xs outline-none" placeholder="Reply to team or mention @AI..." value={content} onChange={(event) => { setContent(event.target.value); onTyping?.() }} onBlur={onStopTyping} onKeyDown={(event) => { if (event.key === 'Enter') void submit() }} />
              <button className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors" type="button" onClick={submit}><span className="material-symbols-outlined text-[20px]">send</span></button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SectionBlock({ title, icon, items, empty }) {
  return (
    <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] space-y-1">
      <div className="flex items-center gap-2 font-bold text-amber-800">
        <span className="material-symbols-outlined text-amber-600 text-[14px]">{icon}</span>
        <span>{title}</span>
      </div>
      {items.length === 0 ? <p className="text-amber-800/70">{empty}</p> : items.slice(0, 3).map((item) => <p className="text-amber-800 truncate" key={item._id}>{item.content}</p>)}
    </div>
  )
}
function WorkspaceModals({
  modal,
  onClose,
  workspace,
  members,
  busy,
  errors,
  onCreateWorkspace,
  onUpdateWorkspace,
  onDeleteWorkspace,
  onInviteMember,
  onUpdateMemberRole,
  onRemoveMember,
}) {
  const [workspaceForm, setWorkspaceForm] = useState({ name: '', description: '' })
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' })
  const workspaceId = getId(workspace)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setWorkspaceForm({ name: workspace?.name || '', description: workspace?.description || '' })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [workspace])

  if (!modal) return null

  const submitWorkspace = async (event) => {
    event.preventDefault()
    if (modal === 'create-workspace') {
      await onCreateWorkspace({ ...workspaceForm, members: [] })
    }
    if (modal === 'workspace-settings' && workspaceId) {
      await onUpdateWorkspace(workspaceId, workspaceForm)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/20 flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-outline-variant bg-white shadow-2xl overflow-hidden">
        <div className="h-14 px-5 border-b border-outline-variant/40 flex items-center justify-between">
          <h3 className="font-bold">
            {modal === 'create-workspace' && 'Create Workspace'}
            {modal === 'workspace-settings' && 'Workspace Settings'}
            {modal === 'delete-workspace' && 'Delete Workspace'}
            {modal === 'members' && 'Members'}
          </h3>
          <button className="p-2 text-outline hover:text-on-surface" type="button" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {(modal === 'create-workspace' || modal === 'workspace-settings') && (
          <form className="p-5 space-y-4" onSubmit={submitWorkspace}>
            <AppleInput label="Workspace Name" value={workspaceForm.name} onChange={(name) => setWorkspaceForm({ ...workspaceForm, name })} />
            <AppleTextarea label="Description" value={workspaceForm.description} onChange={(description) => setWorkspaceForm({ ...workspaceForm, description })} />
            <SubmitRow busy={busy.workspaceCreate || busy.workspaceUpdate} status={errors.workspaceCreate || errors.workspaceUpdate} label={modal === 'create-workspace' ? 'Create Workspace' : 'Save Settings'} />
          </form>
        )}

        {modal === 'delete-workspace' && (
          <div className="p-5 space-y-4">
            <p className="text-sm text-on-surface-variant">Delete <span className="font-bold text-on-surface">{workspace?.name}</span>? This action calls the workspace delete API.</p>
            <div className="flex gap-3">
              <button className="px-4 py-2.5 rounded-lg bg-[#b42318] text-white text-sm font-bold" type="button" onClick={async () => { await onDeleteWorkspace(workspaceId); onClose() }}>Delete</button>
              <button className="px-4 py-2.5 rounded-lg border border-outline-variant text-sm font-bold" type="button" onClick={onClose}>Cancel</button>
            </div>
          </div>
        )}

        {modal === 'members' && (
          <div className="p-5 space-y-5">
            <form className="grid gap-3 sm:grid-cols-[1fr_120px_auto]" onSubmit={async (event) => { event.preventDefault(); await onInviteMember(workspaceId, inviteForm); setInviteForm({ email: '', role: 'member' }) }}>
              <input className="rounded-xl border border-[#e1e1e6] bg-white px-4 py-3 outline-none" placeholder="member@email.com" type="email" value={inviteForm.email} onChange={(event) => setInviteForm({ ...inviteForm, email: event.target.value })} />
              <select className="rounded-xl border border-[#e1e1e6] bg-white px-3 py-3 outline-none" value={inviteForm.role} onChange={(event) => setInviteForm({ ...inviteForm, role: event.target.value })}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button className="rounded-xl bg-primary px-4 py-3 text-white text-sm font-bold" type="submit">Invite</button>
            </form>
            <div className="max-h-80 overflow-y-auto no-scrollbar divide-y divide-outline-variant/30">
              {members.length === 0 ? <p className="py-5 text-sm text-on-surface-variant">No members returned by backend.</p> : members.map((member) => {
                const memberId = member.user?._id || member.user || member._id
                const role = member.role || 'member'
                return (
                  <div className="py-3 flex items-center gap-3" key={memberId}>
                    <span className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-primary">{initials(member.user || member)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{displayUser(member.user || member)}</p>
                      <p className="text-[11px] text-outline capitalize">{role}</p>
                    </div>
                    <select className="rounded-lg border border-outline-variant bg-white px-2 py-1 text-xs capitalize" value={role} disabled={role === 'owner'} onChange={(event) => onUpdateMemberRole(workspaceId, memberId, event.target.value)}>
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                    <button className="p-2 text-[#b42318] hover:bg-red-50 rounded-lg disabled:opacity-40" type="button" disabled={role === 'owner'} onClick={() => onRemoveMember(workspaceId, memberId)}>
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
function getId(item) {
  if (!item) return ''
  if (typeof item === 'string') return item
  return item?._id || item?.id || ''
}

function displayUser(user) {
  if (!user) return 'Unknown'
  if (typeof user === 'string') return user
  return user.username || user.email || user.name || getId(user) || 'Unknown'
}

function initials(user) {
  const label = displayUser(user)
  return label
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U'
}

function formatDate(value) {
  if (!value) return 'never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'unknown'
  return date.toLocaleString()
}

function extractMentions(content) {
  return Array.from(content.matchAll(/@([a-zA-Z0-9_.-]+)/g)).map((match) => match[1])
}

function methodClass(method) {
  if (method === 'POST') return 'text-[#a15c07]'
  if (method === 'GET') return 'text-[#067647]'
  if (method === 'PUT') return 'text-[#175cd3]'
  if (method === 'DEL') return 'text-[#b42318]'
  return 'text-outline'
}

export default App





