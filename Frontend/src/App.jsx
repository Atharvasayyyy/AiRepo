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
  name: '',
  description: '',
  members: [],
}

const initialPage = {
  title: '',
  content: '',
  workspace: '{{workspaceId}}',
  
}

function Playground({ path, navigate }) {
  const { user, logout: authLogout } = useAuth()
  const {
    dashboard,
    selectedWorkspace,
    selectedPage,
    workspacePages,
    favorites,
    recentPages,
    members,
    messages,
    pinnedMessages,
    decisions,
    onlineUsers,
    typingUsers,
    loading,
    errors,
    setSelectedWorkspace,
    setSelectedPage,
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
    loadWorkspacePages,
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
    runAiAction,
    aiResult,
    toggleFavoritePage,
  } = useWorkspace()
  const { joinWorkspace, leaveWorkspace, sendRealtimeMessage, typing, stopTyping } = useSocket()
  const [workspace, setWorkspace] = useState(initialWorkspace)
  const [pageForm, setPageForm] = useState(initialPage)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('')
  const [pageId, setPageId] = useState('')
  const [status, setStatusMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [modal, setModal] = useState(null)
  const [hubOpen, setHubOpen] = useState(true)
  const mode = getPlaygroundMode(path)
  const workspaceList = dashboard.ownedWorkspaces || []
  const sharedWorkspaces = dashboard.sharedWorkspaces || []
  const activeWorkspace = selectedWorkspace || workspaceList.find((item) => getId(item) === selectedWorkspaceId) || workspaceList[0] || null
  const activeWorkspaceId = getId(activeWorkspace) || selectedWorkspaceId
  const activeDoc = {
    workspaceId: activeWorkspaceId,
    pageId,
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
    void loadWorkspacePages(activeWorkspaceId)
    void loadDiscussions(activeWorkspaceId)
    return () => leaveWorkspace(activeWorkspaceId)
  }, [activeWorkspaceId, joinWorkspace, leaveWorkspace, loadDiscussions, loadMembers, loadWorkspacePages])

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
    if (path === '/pages/new') {
      setPageId('')
      setSelectedPage(null)
      setPageForm({ title: '', content: '', workspace: activeWorkspaceId })
    }
  }, [activeWorkspaceId, path, setSelectedPage])

  useEffect(() => {
    if (selectedPage) {
      const timer = window.setTimeout(() => {
        setPageId(getId(selectedPage))
        setPageForm({
          title: selectedPage.title || '',
          content: selectedPage.content || '',
          workspace: getId(selectedPage.workspace) || activeWorkspaceId,
        })
        const nextWorkspaceId = getId(selectedPage.workspace)
        if (nextWorkspaceId) setSelectedWorkspaceId(nextWorkspaceId)
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
      const nextPageId = getId(created)
      setPageId(nextPageId)
      setStatusMessage('Page created.')
      navigate(nextPageId ? `/pages/${nextPageId}` : '/dashboard')
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
    setPageId('')
    setSelectedPage(null)
  }

  const handleWorkspaceCreated = async (payload) => {
    const created = await createWorkspace(payload)
    const nextId = getId(created)
    setSelectedWorkspaceId(nextId)
    setSelectedWorkspace(created)
    setWorkspace({
      name: created?.name || payload.name || initialWorkspace.name,
      description: created?.description || payload.description || initialWorkspace.description,
      members: Array.isArray(created?.members) ? created.members : [],
    })
    setPageForm((current) => ({ ...current, workspace: nextId || current.workspace || '{{workspaceId}}' }))
    setStatusMessage('Workspace created. Create a page inside it next.')
    navigate('/dashboard')
    return created
  }

  return (
    <div className="h-screen overflow-hidden bg-surface text-on-surface flex flex-col lg:flex-row">
      <WorkspaceSidebar
        path={path}
        navigate={navigate}
        activeDoc={activeDoc}
        ownedWorkspaces={workspaceList}
        workspacePages={workspacePages}
        sharedWorkspaces={sharedWorkspaces}
        user={user}
        onLogout={logout}
        onSearch={runSearch}
        searchResults={searchResults}
        onOpenModal={setModal}
        onSelectWorkspace={handleWorkspaceSelect}
      />
      <main className="hub-transition flex-1 min-w-0 flex flex-col bg-white">
        <WorkspaceTopbar
          activeDoc={activeDoc}
          user={user}
          onlineUsers={onlineUsers}
          autosave={autosave}
          messageCount={messages.length}
          onLogout={logout}
          onProfile={() => navigate('/profile')}
          onToggleHub={() => setHubOpen((value) => !value)}
        />
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
              const nextWorkspace = workspaceList.find((item) => getId(item) === id)
              if (nextWorkspace) handleWorkspaceSelect(nextWorkspace)
              else setSelectedWorkspaceId(id)
              setPageForm((current) => ({ ...current, workspace: id }))
            }}
            onSubmit={submitPage}
            busy={busy || loading.pageCreate}
            status={status || errors.pageCreate}
          />
        )}
        {mode === 'dashboard' && (
          <DashboardHome
            activeDoc={activeDoc}
            pageForm={pageForm}
            onPageChange={setPageForm}
            loading={loading.dashboard}
            selectedWorkspaceId={activeWorkspaceId}
            navigate={navigate}
            onRefresh={refreshDashboard}
            onOpenModal={setModal}
            onDeletePage={() => pageId && deletePage(pageId)}
            onArchivePage={() => pageId && archivePage(pageId)}
            onUnarchivePage={() => pageId && unarchivePage(pageId)}
            onToggleFavorite={() => pageId && toggleFavoritePage(pageId, favorites.some((page) => getId(page) === pageId))}
            isFavorite={favorites.some((page) => getId(page) === pageId)}
            autosave={autosave}
          />
        )}
      </main>
      <DiscussionHub
        open={hubOpen}
        workspaceId={activeWorkspaceId}
        messages={messages}
        pinnedMessages={pinnedMessages}
        decisions={decisions}
        typingUsers={typingUsers}
        currentUser={user}
        onClose={() => setHubOpen(false)}
        aiResult={aiResult}
        aiLoading={loading.ai}
        aiError={errors.ai}
        pageContent={pageForm.content}
        onAiAction={async (action) => {
          await runAiAction({
            action,
            workspaceId: activeWorkspaceId,
            pageContent: pageForm.content,
            chatHistory: messages.map((message) => `${displayUser(message.sender)}: ${message.content}`).join('\n'),
          })
        }}
        onSend={async (payload) => {
          const message = await sendMessage(activeWorkspaceId, {
            ...payload,
            pageContent: payload.content?.trim().startsWith('@AI') ? pageForm.content : undefined,
            chatHistory: payload.content?.trim().startsWith('@AI') ? messages.map((item) => `${displayUser(item.sender)}: ${item.content}`).join('\n') : undefined,
          })
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
        onCreateWorkspace={handleWorkspaceCreated}
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
  return 'dashboard'
}

function WorkspaceSidebar({
  path,
  navigate,
  activeDoc,
  ownedWorkspaces = [],
  workspacePages = [],
  sharedWorkspaces = [],
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
    <aside className="hidden lg:flex w-[20%] min-w-[240px] max-w-[300px] flex-shrink-0 bg-surface-container-low border-r border-outline-variant flex-col z-50 overflow-hidden">
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
              {Object.entries(searchResults).flatMap(([type, values]) => (Array.isArray(values) ? values.map((item) => ({ type, item })) : [])).slice(0, 6).map(({ type, item }) => (
                <button className="block w-full rounded px-2 py-1 text-left hover:bg-surface-container-low" key={`${type}-${getId(item) || item.title || item.name || item.email}`} type="button" onClick={() => {
                  if (type === 'pages') navigate(`/pages/${getId(item)}`)
                  if (type === 'workspaces') navigate(`/workspaces/${getId(item)}`)
                }}>
                  <span className="font-bold capitalize">{type}</span> · {item.title || item.name || item.username || item.email || item.content}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="px-3 text-[10px] font-bold text-outline uppercase tracking-widest mb-2 flex justify-between items-center">
            Owned
            <button className="hover:text-primary" type="button" onClick={() => onOpenModal?.('create-workspace')}>
              <span className="material-symbols-outlined text-[14px]">add</span>
            </button>
          </h3>
          <div className="space-y-0.5">
            {[...ownedWorkspaces, ...sharedWorkspaces].length === 0 ? (
              <p className="px-3 py-2 text-xs text-outline">No workspaces yet.</p>
            ) : (
              [...ownedWorkspaces, ...sharedWorkspaces].map((workspace) => {
                const workspaceId = getId(workspace)
                const selected = activeDoc.workspaceId === workspaceId
                return (
                  <div key={workspaceId || workspace.name}>
                    <button
                      className={`w-full flex items-center justify-between px-3 py-2 text-on-surface hover:bg-surface-container-high rounded-lg transition-colors group ${selected ? 'bg-white' : ''}`}
                      type="button"
                      onClick={() => onSelectWorkspace?.(workspace)}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-outline">{selected ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}</span>
                        <span className="material-symbols-outlined text-[18px] text-primary">folder_open</span>
                        <span className="text-sm font-semibold truncate">{workspace.name}</span>
                      </span>
                      <span className="hidden group-hover:flex items-center gap-1 text-outline">
                        <span className="material-symbols-outlined text-[16px] hover:text-primary" onClick={(event) => { event.stopPropagation(); onSelectWorkspace?.(workspace); navigate('/pages/new') }}>add</span>
                        <span className="material-symbols-outlined text-[16px] hover:text-primary" onClick={(event) => { event.stopPropagation(); onSelectWorkspace?.(workspace); onOpenModal?.('workspace-settings') }}>settings</span>
                      </span>
                    </button>
                    {selected && (
                      <div className="ml-8 space-y-0.5 mt-0.5">
                        <button className="w-full flex items-center gap-2 px-3 py-1.5 text-primary hover:bg-surface-container-high rounded-lg text-sm font-bold transition-colors" type="button" onClick={() => navigate('/pages/new')}>
                          <span className="material-symbols-outlined text-[18px]">add</span>
                          <span>Create page</span>
                        </button>
                        {workspacePages.length === 0 ? (
                          <p className="px-3 py-1.5 text-xs text-outline">No pages in this workspace.</p>
                        ) : (
                          workspacePages.map((page) => (
                            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg text-sm transition-colors" key={getId(page) || page.title} type="button" onClick={() => navigate(`/pages/${getId(page)}`)}>
                              <span className="material-symbols-outlined text-[18px]">description</span>
                              <span className="truncate">{page.title || 'Untitled page'}</span>
                            </button>
                          ))
                        )}
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
                        <button className="w-full flex items-center gap-2 px-3 py-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg text-sm transition-colors" type="button" onClick={() => onOpenModal?.('workspace-settings')}>
                          <span className="material-symbols-outlined text-[18px]">settings</span>
                          <span>Settings</span>
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
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

function WorkspaceTopbar({ activeDoc, user, onlineUsers = [], autosave, messageCount = 0, onLogout, onProfile, onToggleHub }) {
  return (
    <header className="h-auto min-h-16 px-4 sm:px-6 border-b border-outline-variant bg-white/95 backdrop-blur-md sticky top-0 z-40 flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4 min-w-0">
        <button className="lg:hidden w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white" type="button">
          <span className="material-symbols-outlined text-[20px]">terminal</span>
        </button>
        <div className="min-w-0">
          <nav className="flex items-center text-[11px] text-outline font-bold uppercase tracking-wider">
            <span className="truncate">{activeDoc.workspaceName || 'No workspace selected'}</span>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-on-surface truncate">{activeDoc.pageTitle || 'No page selected'}</span>
          </nav>
          <div className="flex items-center gap-2 mt-0.5 min-w-0">
            <h1 className="text-lg font-bold text-on-surface truncate">{activeDoc.pageTitle || 'No page selected'}</h1>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between md:justify-end gap-3">
        <div className="hidden lg:flex items-center gap-3 text-xs text-outline border-r border-outline-variant/30 pr-5">
          <div className="flex -space-x-2">
            <span className="w-8 h-8 rounded-full bg-primary text-white text-[10px] font-bold border-2 border-white flex items-center justify-center">{initials(user)}</span>
            {onlineUsers.slice(0, 1).map((onlineUser) => (
              <span className="w-8 h-8 rounded-full bg-surface-container border-2 border-white flex items-center justify-center text-[10px] font-bold text-outline" key={getId(onlineUser) || displayUser(onlineUser)}>
                {initials(onlineUser)}
              </span>
            ))}
            {onlineUsers.length > 1 && <span className="w-8 h-8 rounded-full bg-surface-container border-2 border-white flex items-center justify-center text-[10px] font-bold text-outline">+{onlineUsers.length - 1}</span>}
          </div>
          <div className="flex items-center gap-1.5 text-green-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 presence-pulse"></span>
            <span>Live</span>
          </div>
          <span>{autosave?.saving ? 'Saving...' : autosave?.savedAt ? `Saved ${autosave.savedAt.toLocaleTimeString()}` : activeDoc.updatedAt ? `Updated ${formatDate(activeDoc.updatedAt)}` : 'Saved'}</span>
        </div>
        <button className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors relative" title="Discussion Hub" type="button" onClick={onToggleHub}>
          <span className="material-symbols-outlined">forum</span>
          {messageCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error border-2 border-white rounded-full"></span>}
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
  selectedWorkspaceId,
  navigate,
  onRefresh,
  onOpenModal,
  onDeletePage,
  onArchivePage,
  onToggleFavorite,
  isFavorite,
  autosave,
}) {
  const hasPage = Boolean(activeDoc.pageId)

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth bg-white">
      <div className="max-w-[800px] mx-auto pt-8 sm:pt-12 pb-24 px-4 sm:px-8">
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

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex-1 min-w-0">
            <input
              className="w-full bg-transparent font-display-lg text-4xl sm:text-display-lg text-on-surface mb-6 leading-tight outline-none"
              value={pageForm.title}
              onChange={(event) => onPageChange((current) => ({ ...current, title: event.target.value }))}
              placeholder="Untitled page"
              disabled={!hasPage}
            />
            <div className="relative group mb-2 pl-1">
              <textarea
                className="w-full min-h-72 resize-none bg-transparent text-body-lg text-on-surface-variant leading-relaxed font-medium outline-none disabled:text-outline"
                value={pageForm.content}
                onChange={(event) => onPageChange((current) => ({ ...current, content: event.target.value }))}
                placeholder={hasPage ? 'Start writing...' : 'Select or create a page to start writing.'}
                disabled={!hasPage}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-outline">
              <span>Created by {activeDoc.createdBy ? displayUser(activeDoc.createdBy) : 'Not available'}</span>
              <span>Modified by {activeDoc.modifiedBy ? displayUser(activeDoc.modifiedBy) : 'Not available'}</span>
              <span>{activeDoc.updatedAt ? `Updated ${formatDate(activeDoc.updatedAt)}` : 'Not saved yet'}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-bold" type="button" onClick={() => onOpenModal('create-workspace')}>
              New Workspace
            </button>
            <button className="px-4 py-2.5 rounded-lg border border-outline-variant text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50" type="button" disabled={!selectedWorkspaceId} onClick={() => navigate('/pages/new')}>
              Create Page
            </button>
            <button className="px-3 py-2.5 rounded-lg border border-outline-variant text-sm font-bold disabled:opacity-50" title={isFavorite ? 'Remove favorite' : 'Add favorite'} type="button" disabled={!hasPage} onClick={onToggleFavorite}>
              <span className="material-symbols-outlined text-[18px] align-middle">{isFavorite ? 'star' : 'star_border'}</span>
            </button>
            <button className="px-3 py-2.5 rounded-lg border border-outline-variant text-sm font-bold disabled:opacity-50" type="button" disabled={!hasPage} onClick={onArchivePage}>Archive</button>
            <button className="px-3 py-2.5 rounded-lg border border-[#f1b5b5] text-[#b42318] text-sm font-bold disabled:opacity-50" type="button" disabled={!hasPage} onClick={onDeletePage}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  )
}
function WorkspaceCreatePanel({ workspace, onChange, onSubmit, busy, status }) {
  return (
    <FormShell title="Create workspace" subtitle="Create a real backend workspace." method="POST">
      <form className="space-y-5" onSubmit={onSubmit}>
        <AppleInput label="Name" value={workspace.name} onChange={(name) => onChange({ ...workspace, name })} />
        <AppleTextarea label="Description" value={workspace.description} onChange={(description) => onChange({ ...workspace, description })} />
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
  const selectedWorkspace = workspaceList.find((item) => getId(item) === payload.workspace)
  const canCreate = Boolean(payload.workspace && pageForm.title.trim())

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <form className="min-h-full" onSubmit={onSubmit}>
        <div className="border-b border-outline-variant/30 bg-white/95 px-4 py-3 sm:px-8 sticky top-0 z-20">
          <div className="max-w-4xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="material-symbols-outlined text-primary">description</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-on-surface">{selectedWorkspace?.name || 'Select a workspace'}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {workspaceList.length > 0 ? (
                <select
                  className="min-w-0 rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm outline-none focus:border-primary"
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
              ) : (
                <input
                  className="min-w-0 rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="Workspace ID"
                  value={pageForm.workspace === '{{workspaceId}}' ? workspaceId : pageForm.workspace}
                  onChange={(event) => onChange({ ...pageForm, workspace: event.target.value })}
                />
              )}
              <button className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={busy || !canCreate}>
                {busy ? 'Creating...' : 'Create Page'}
              </button>
            </div>
          </div>
        </div>

        <section className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
          {status && (
            <div className="mb-6 rounded-lg border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
              {status}
            </div>
          )}
          <input
            className="w-full bg-transparent font-display-lg text-4xl sm:text-6xl font-bold leading-tight text-on-surface outline-none placeholder:text-outline/70"
            value={pageForm.title}
            onChange={(event) => onChange({ ...pageForm, title: event.target.value })}
            placeholder="Untitled"
            autoFocus
          />
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-outline">
            <span className="rounded-md bg-surface-container-low px-2.5 py-1">Workspace: {selectedWorkspace?.name || payload.workspace || 'not selected'}</span>
          </div>
          <textarea
            className="mt-10 min-h-[52vh] w-full resize-none bg-transparent text-lg leading-8 text-on-surface-variant outline-none placeholder:text-outline"
            value={pageForm.content}
            onChange={(event) => onChange({ ...pageForm, content: event.target.value })}
            placeholder="Start writing..."
          />
        </section>
      </form>
    </div>
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

function DiscussionHub({
  open,
  workspaceId,
  messages = [],
  pinnedMessages = [],
  decisions = [],
  typingUsers = [],
  currentUser,
  onClose,
  onAiAction,
  aiResult,
  aiLoading,
  aiError,
  onSend,
  onDelete,
  onPin,
  onTyping,
  onStopTyping,
}) {
  const [content, setContent] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [tab, setTab] = useState('messages')
  const quickActions = [
    ['summarize', 'Summarize', 'summarize'],
    ['checklist', 'Tasks', 'tasks'],
    ['decision_making', 'Decisions', 'decisions'],
    ['article', 'PRD', 'prd'],
  ]

  const submit = async () => {
    if (!workspaceId || !content.trim()) return
    await onSend({ content: content.trim(), mentions: extractMentions(content), replyTo: replyTo?._id || null, type: content.trim().startsWith('@AI') ? 'ai' : 'message' })
    setContent('')
    setReplyTo(null)
    onStopTyping?.()
  }

  const triggerPrompt = async (action) => {
    if (!workspaceId) return
    await onAiAction(action)
  }

  if (!open) return null

  return (
    <aside className="hidden lg:flex w-[25%] min-w-[320px] max-w-[420px] flex-shrink-0 bg-white border-l border-outline-variant flex-col z-50 hub-transition">
      <div className="flex flex-col">
        <div className="h-16 flex items-center justify-between px-6 border-b border-outline-variant">
          <h3 className="font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
            Discussion Hub
          </h3>
          <button className="p-1 hover:bg-surface-container rounded-md text-outline" type="button" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex border-b border-outline-variant/30">
          {[
            ['messages', 'Messages'],
            ['pinned', 'Pinned'],
            ['decisions', 'Decisions'],
          ].map(([key, label]) => (
            <button className={`flex-1 py-3 text-xs font-bold transition-colors ${tab === key ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-outline hover:text-on-surface'}`} key={key} type="button" onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        <div className="bg-surface-container-low/50 p-4 rounded-xl border border-outline-variant/30">
          <h4 className="text-[10px] font-bold text-outline uppercase tracking-widest mb-3">AI Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map(([icon, label, action]) => (
              <button className="flex items-center gap-2 p-2 bg-white border border-outline-variant hover:border-primary rounded-lg transition-all group disabled:opacity-50" key={label} type="button" disabled={aiLoading} onClick={() => triggerPrompt(action)}>
                <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary">{icon}</span>
                <span className="text-[10px] font-bold">{label}</span>
              </button>
            ))}
          </div>
          {aiLoading && <p className="mt-3 text-xs text-on-surface-variant">AI is processing the current page context...</p>}
          {aiError && <p className="mt-3 text-xs text-[#b42318]">{aiError}</p>}
          {aiResult?.content && (
            <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">{aiResult.action}</p>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-on-surface-variant">{aiResult.content}</p>
            </div>
          )}
        </div>

        {tab === 'pinned' && <HubList title="Pinned Messages" items={pinnedMessages} empty="No pinned messages." />}
        {tab === 'decisions' && <HubList title="Decisions" items={decisions} empty="No decisions yet." />}

        {tab === 'messages' && (
          <div className="space-y-4">
            {messages.length === 0 ? <p className="text-xs text-on-surface-variant">No messages yet.</p> : messages.map((message) => (
              <div className="flex gap-2.5" key={message._id || message.createdAt}>
                <div className={`${message.type === 'ai_message' ? 'bg-primary shadow-md' : 'bg-surface-container-high'} w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${message.type === 'ai_message' ? 'text-white' : 'text-primary'} flex-shrink-0`}>
                  {message.type === 'ai_message' ? <span className="material-symbols-outlined text-[16px]">smart_toy</span> : initials(message.sender || currentUser)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className={`text-xs font-bold truncate ${message.type === 'ai_message' ? 'text-primary' : 'text-on-surface'}`}>{message.type === 'ai_message' ? 'AI Assistant' : displayUser(message.sender || currentUser)}</span>
                    <span className="text-[9px] text-outline flex-shrink-0">{formatDate(message.createdAt)}</span>
                  </div>
                  <div className={`px-3 py-2 rounded-2xl rounded-tl-none border shadow-sm relative overflow-hidden ${message.type === 'ai_message' ? 'bg-primary/5 border-primary/20' : 'bg-surface-container border-outline-variant/30'}`}>
                    {message.type === 'ai_message' && <div className="absolute top-0 left-0 w-1 h-full bg-primary/20"></div>}
                    {message.replyTo && <p className="mb-1 text-[10px] text-outline">Replying to {displayUser(message.replyTo.sender)}</p>}
                    <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <div className="mt-2 flex gap-2 text-[9px] font-bold text-outline">
                      <button type="button" onClick={() => setReplyTo(message)}>Reply</button>
                      <button type="button" onClick={() => onPin(message._id, message.isPinned)}>{message.isPinned ? 'Unpin' : 'Pin'}</button>
                      <button type="button" onClick={() => onDelete(message._id)}>Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-primary animate-pulse ml-9">
                <div className="flex gap-1"><span className="w-1 h-1 bg-primary rounded-full"></span><span className="w-1 h-1 bg-primary rounded-full"></span><span className="w-1 h-1 bg-primary rounded-full"></span></div>
                <span className="text-[9px] font-bold">{typingUsers.map(displayUser).join(', ')} typing...</span>
              </div>
            )}
            {aiLoading && <p className="ml-9 text-xs text-primary">AI is responding...</p>}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-outline-variant bg-white">
        {replyTo && <div className="mb-2 text-[10px] text-outline flex justify-between"><span>Replying to {displayUser(replyTo.sender)}</span><button type="button" onClick={() => setReplyTo(null)}>Cancel</button></div>}
        <div className="relative">
          <textarea className="w-full pl-4 pr-12 py-3 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs font-medium transition-all resize-none max-h-24 no-scrollbar" placeholder="Message workspace..." rows="1" value={content} onBlur={onStopTyping} onChange={(event) => { setContent(event.target.value); onTyping?.() }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void submit() } }} />
          <button className="absolute right-2 bottom-2 p-1.5 bg-primary text-white rounded-lg shadow-lg hover:scale-105 transition-transform" type="button" onClick={submit}>
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

function HubList({ title, items, empty }) {
  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-bold text-outline uppercase tracking-widest">{title}</h4>
      {items.length === 0 ? <p className="text-xs text-on-surface-variant">{empty}</p> : items.map((item) => (
        <div className="bg-surface-container px-3 py-2 rounded-2xl border border-outline-variant/30 shadow-sm" key={item._id || item.content}>
          <div className="flex items-center justify-between mb-1 gap-2">
            <span className="text-xs font-bold text-on-surface truncate">{displayUser(item.sender)}</span>
            <span className="text-[9px] text-outline flex-shrink-0">{formatDate(item.createdAt)}</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed truncate">{item.content}</p>
        </div>
      ))}
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






