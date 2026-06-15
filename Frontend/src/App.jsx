import { useCallback, useEffect, useMemo, useState } from 'react'
import { pageHtml } from './pageHtml'
import { apiRequest, clearToken, readToken, saveToken } from './lib/api'

const routes = {
  '/': 'landing',
  '/login': 'login',
  '/signup': 'signup',
  '/dashboard': 'dashboard',
  '/playground': 'dashboard',
  '/workspaces/new': 'playground',
  '/pages/new': 'playground',
}

function getRoute(pathname = window.location.pathname) {
  if (pathname.startsWith('/workspaces/')) return 'playground'
  if (pathname.startsWith('/pages/')) return 'playground'
  return routes[pathname] ?? 'landing'
}

function App() {
  const [page, setPage] = useState(getRoute)
  const [path, setPath] = useState(window.location.pathname)

  const navigate = (href) => {
    window.history.pushState({}, '', href)
    setPath(window.location.pathname)
    setPage(getRoute())
    window.scrollTo(0, 0)
  }

  useEffect(() => {
    const onPopState = () => {
      setPath(window.location.pathname)
      setPage(getRoute())
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

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
  }, [])

  usePageBehavior(page)

  if (page === 'dashboard' || page === 'playground') {
    return <Playground path={path} navigate={navigate} />
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

function usePageBehavior(page) {
  useEffect(() => {
    if (page === 'landing') return runLandingDemo()
    if (page === 'login') return runLoginPage()
    if (page === 'signup') return runSignupPage()
    return undefined
  }, [page])
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

function runLoginPage() {
  const cleanup = []
  const darkToggle = document.querySelector('nav button')
  const icon = darkToggle?.querySelector('.material-symbols-outlined')
  const form = document.querySelector('form')
  const loginBtn = document.querySelector('button.bg-primary')
  const emailInput = document.querySelector('input[type="email"]')
  const passwordInput = document.querySelector('input[type="password"]')
  const statusNode = ensureStatusNode(form)

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark')
    if (icon) {
      icon.textContent = document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode'
    }
  }
  darkToggle?.addEventListener('click', toggleDark)
  cleanup.push(() => darkToggle?.removeEventListener('click', toggleDark))

  document.querySelectorAll('input').forEach((input) => {
    const label = input.closest('.space-y-2')?.querySelector('label')
    const focus = () => label?.classList.replace('text-on-surface-variant', 'text-primary')
    const blur = () => label?.classList.replace('text-primary', 'text-on-surface-variant')
    input.addEventListener('focus', focus)
    input.addEventListener('blur', blur)
    cleanup.push(() => {
      input.removeEventListener('focus', focus)
      input.removeEventListener('blur', blur)
    })
  })

  const submit = async (event) => {
    event.preventDefault()
    if (!loginBtn) return

    const email = emailInput?.value?.trim() || ''
    const password = passwordInput?.value || ''
    if (!email || !password) {
      setStatus(statusNode, 'Email and password are required.', true)
      return
    }

    const originalContent = loginBtn.innerHTML
    loginBtn.innerHTML =
      '<span class="material-symbols-outlined animate-spin" data-icon="progress_activity">progress_activity</span>'
    loginBtn.disabled = true

    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      if (data?.token) {
        saveToken(data.token)
      }

      setStatus(statusNode, 'Login successful. Opening your dashboard.', false)
      window.history.pushState({}, '', '/dashboard')
      window.dispatchEvent(new PopStateEvent('popstate'))
    } catch (error) {
      setStatus(statusNode, error.message || 'Login failed.', true)
    } finally {
      loginBtn.innerHTML = originalContent
      loginBtn.disabled = false
    }
  }
  form?.addEventListener('submit', submit)
  cleanup.push(() => form?.removeEventListener('submit', submit))

  return () => cleanup.forEach((fn) => fn())
}

function runSignupPage() {
  const cleanup = []
  const darkToggle = document.querySelector('header button')
  const icon = document.getElementById('dark-mode-icon')
  const form = document.querySelector('form')
  const submitBtn = form?.querySelector('button[type="submit"], button:not([type])')
  const inputs = form ? Array.from(form.querySelectorAll('input')) : []
  const [nameInput, emailInput, passwordInput] = inputs
  const statusNode = ensureStatusNode(form)

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark')
    if (icon) {
      icon.textContent = document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode'
    }
  }
  darkToggle?.addEventListener('click', toggleDark)
  cleanup.push(() => darkToggle?.removeEventListener('click', toggleDark))

  const submit = async (event) => {
    event.preventDefault()
    if (!submitBtn) return

    const username = nameInput?.value?.trim() || ''
    const email = emailInput?.value?.trim() || ''
    const password = passwordInput?.value || ''

    if (!username || !email || !password) {
      setStatus(statusNode, 'Name, email, and password are required.', true)
      return
    }

    const originalContent = submitBtn.innerHTML
    submitBtn.disabled = true
    submitBtn.innerHTML = 'Creating account...'

    try {
      await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      })

      setStatus(statusNode, 'Account created successfully. You can log in now.', false)
      form.reset()
      window.history.pushState({}, '', '/login')
      setTimeout(() => {
        window.dispatchEvent(new PopStateEvent('popstate'))
      }, 0)
    } catch (error) {
      setStatus(statusNode, error.message || 'Signup failed.', true)
    } finally {
      submitBtn.innerHTML = originalContent
      submitBtn.disabled = false
    }
  }
  form?.addEventListener('submit', submit)
  cleanup.push(() => form?.removeEventListener('submit', submit))

  const parallax = (event) => {
    const x = (window.innerWidth - event.pageX * 2) / 100
    const y = (window.innerHeight - event.pageY * 2) / 100

    document.querySelectorAll('.sketch-annotation').forEach((el) => {
      const rotate = el.classList.contains('rotate-[-6deg]') ? -6 : 4
      el.style.transform = `translateX(${x * 2}px) translateY(${y * 2}px) rotate(${rotate}deg)`
    })
  }
  document.addEventListener('mousemove', parallax)
  cleanup.push(() => document.removeEventListener('mousemove', parallax))

  return () => cleanup.forEach((fn) => fn())
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
  const [workspace, setWorkspace] = useState(initialWorkspace)
  const [pageForm, setPageForm] = useState(initialPage)
  const [workspaceList, setWorkspaceList] = useState([])
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('')
  const [pageId, setPageId] = useState('')
  const [activeDoc, setActiveDoc] = useState({
    workspaceName: 'Workspace',
    pageTitle: 'Untitled',
    pageContent: 'Create a workspace and a page to start writing.',
  })
  const [status, setStatusMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const mode = getPlaygroundMode(path)

  const loadDashboard = useCallback(async (preferredWorkspaceId = '') => {
    if (!readToken()) {
      navigate('/login')
      return
    }

    setLoading(true)
    try {
      const dashboard = await authedRequest('/api/workspace/dashboard')
      const nextWorkspaces = Array.isArray(dashboard?.workspaces) ? dashboard.workspaces : []
      const selected = nextWorkspaces.find((item) => getId(item) === preferredWorkspaceId) || nextWorkspaces[0] || null
      const selectedId = getId(selected)

      setWorkspaceList(nextWorkspaces)
      setSelectedWorkspaceId(selectedId)

      if (selected) {
        setWorkspace({
          name: selected.name || initialWorkspace.name,
          description: selected.description || initialWorkspace.description,
          members: Array.isArray(selected.members) ? selected.members : [],
        })
        setPageForm((current) => ({ ...current, workspace: selectedId }))
        setActiveDoc({
          workspaceName: selected.name || 'Workspace',
          pageTitle: 'Workspace overview',
          pageContent: selected.description || 'No description added yet.',
        })
      }
    } catch (error) {
      setStatusMessage(error.message || 'Unable to load dashboard.')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    if (mode === 'dashboard') {
      void loadDashboard(selectedWorkspaceId)
    }
  }, [mode, loadDashboard, selectedWorkspaceId])

  const logout = () => {
    clearToken()
    navigate('/login')
  }

  const submitWorkspace = async (event) => {
    event.preventDefault()
    setBusy(true)
    setStatusMessage('')

    try {
      const result = await authedRequest('/api/workspace/create', {
        method: 'POST',
        body: JSON.stringify(workspace),
      })
      const created = result?.workspace || result
      const nextId = getId(created)
      setSelectedWorkspaceId(nextId)
      setPageForm((current) => ({ ...current, workspace: nextId || '{{workspaceId}}' }))
      setActiveDoc({
        workspaceName: workspace.name,
        pageTitle: 'Workspace overview',
        pageContent: workspace.description,
      })
      setStatusMessage('Workspace created.')
      await loadDashboard(nextId)
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
        workspace: pageForm.workspace === '{{workspaceId}}' ? selectedWorkspaceId : pageForm.workspace,
      }
      const result = await authedRequest('/api/page/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const created = result?.page || result
      setPageId(getId(created))
      setActiveDoc({
        workspaceName: workspace.name,
        pageTitle: created?.title || pageForm.title,
        pageContent: created?.content || pageForm.content,
      })
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
        if (!selectedWorkspaceId) throw new Error('Select a workspace first.')
        await authedRequest(`/api/workspace/${selectedWorkspaceId}`)
        setStatusMessage('Workspace loaded.')
      }
      if (path === '/workspaces/delete') {
        if (!selectedWorkspaceId) throw new Error('Select a workspace first.')
        await authedRequest(`/api/workspace/${selectedWorkspaceId}`, { method: 'DELETE' })
        setStatusMessage('Workspace deleted.')
        await loadDashboard('')
      }
      if (path === '/pages/select') {
        if (!pageId) throw new Error('Create a page first.')
        await authedRequest(`/api/page/${pageId}`)
        setStatusMessage('Page loaded.')
      }
      if (path === '/pages/edit') {
        if (!pageId) throw new Error('Create a page first.')
        await authedRequest(`/api/page/${pageId}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: pageForm.title,
            content: pageForm.content,
            workspace: selectedWorkspaceId,
          }),
        })
        setStatusMessage('Page updated.')
      }
      if (path === '/pages/delete') {
        if (!pageId) throw new Error('Create a page first.')
        await authedRequest(`/api/page/${pageId}`, { method: 'DELETE' })
        setStatusMessage('Page deleted.')
      }
      if (path === '/pages/archive') {
        if (!pageId) throw new Error('Create a page first.')
        await authedRequest(`/api/page/${pageId}/archive`, { method: 'POST' })
        setStatusMessage('Page archived.')
      }
      if (path === '/pages/unarchive') {
        if (!pageId) throw new Error('Create a page first.')
        await authedRequest(`/api/page/${pageId}/unarchive`, { method: 'POST' })
        setStatusMessage('Page unarchived.')
      }
    } catch (error) {
      setStatusMessage(error.message || 'Action failed.')
    } finally {
      setBusy(false)
    }
  }

  const selectedWorkspace = workspaceList.find((item) => getId(item) === selectedWorkspaceId) || null

  return (
    <div className="h-screen overflow-hidden bg-[#f7f7f8] text-on-surface flex">
      <WorkspaceSidebar path={path} navigate={navigate} activeDoc={activeDoc} onLogout={logout} />
      <main className="flex-1 min-w-0 flex flex-col bg-white">
        <WorkspaceTopbar activeDoc={activeDoc} onLogout={logout} />
        {mode === 'workspace-new' && (
          <WorkspaceCreatePanel workspace={workspace} onChange={setWorkspace} onSubmit={submitWorkspace} busy={busy} status={status} />
        )}
        {mode === 'page-new' && (
          <PageCreatePanel
            pageForm={pageForm}
            workspaceList={workspaceList}
            workspaceId={selectedWorkspaceId}
            onChange={setPageForm}
            onWorkspaceSelect={(id) => {
              setSelectedWorkspaceId(id)
              setPageForm((current) => ({ ...current, workspace: id }))
            }}
            onSubmit={submitPage}
            busy={busy}
            status={status}
          />
        )}
        {mode === 'action' && (
          <RouteActionPanel path={path} workspaceId={selectedWorkspaceId} pageId={pageId} busy={busy} status={status} onRun={runRouteAction} />
        )}
        {mode === 'dashboard' && (
          <DashboardHome
            activeDoc={activeDoc}
            loading={loading}
            selectedWorkspace={selectedWorkspace}
            workspaceList={workspaceList}
            selectedWorkspaceId={selectedWorkspaceId}
            navigate={navigate}
            onRefresh={() => void loadDashboard(selectedWorkspaceId)}
            onSelectWorkspace={(nextWorkspace) => {
              const nextId = getId(nextWorkspace)
              setSelectedWorkspaceId(nextId)
              setWorkspace({
                name: nextWorkspace.name || initialWorkspace.name,
                description: nextWorkspace.description || initialWorkspace.description,
                members: Array.isArray(nextWorkspace.members) ? nextWorkspace.members : [],
              })
              setPageForm((current) => ({ ...current, workspace: nextId }))
              setActiveDoc({
                workspaceName: nextWorkspace.name || 'Workspace',
                pageTitle: 'Workspace overview',
                pageContent: nextWorkspace.description || 'No description added yet.',
              })
            }}
          />
        )}
      </main>
    </div>
  )
}

function getPlaygroundMode(path) {
  if (path === '/workspaces/new') return 'workspace-new'
  if (path === '/pages/new') return 'page-new'
  if (path === '/dashboard' || path === '/playground') return 'dashboard'
  return 'action'
}

function WorkspaceSidebar({ path, navigate, activeDoc, onLogout }) {
  return (
    <aside className="w-64 flex-shrink-0 bg-surface-container-low border-r border-outline-variant flex flex-col transition-all duration-300">
      <div className="p-4 flex items-center justify-between">
        <button className="flex items-center gap-2 text-left" type="button" onClick={() => navigate('/dashboard')}>
          <span className="w-8 h-8 rounded-lg bg-dev-indigo flex items-center justify-center text-white font-bold">
            D
          </span>
          <span className="font-headline-md text-body-md font-bold text-on-surface">DevNotes</span>
        </button>
        <button className="p-1 hover:bg-surface-container-high rounded-lg transition-colors" type="button">
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">keyboard_double_arrow_left</span>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 space-y-1 no-scrollbar">
        <div className="mb-4">
          <SidebarItem active={false} icon="search" label="Search" />
          <SidebarItem active={path === '/dashboard' || path === '/playground'} icon="home" label="Home" onClick={() => navigate('/dashboard')} />
          <SidebarItem active={false} icon="schedule" label="Recent" />
          <SidebarItem active={false} icon="star" label="Favorites" />
        </div>

        <div className="mt-6">
          <h3 className="px-3 text-[11px] font-bold text-outline uppercase tracking-wider mb-2">Workspace</h3>
          <div className="space-y-0.5">
            <button
              className="w-full flex items-center gap-2 px-3 py-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors"
              type="button"
              onClick={() => navigate('/dashboard')}
            >
              <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
              <span className="material-symbols-outlined text-[18px]">folder</span>
              <span className="text-sm">{activeDoc.workspaceName || 'Engineering'}</span>
            </button>
            <div className="ml-8 space-y-0.5 mt-0.5">
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 bg-dev-indigo/10 text-dev-indigo rounded-lg text-sm font-medium"
                type="button"
                onClick={() => navigate('/dashboard')}
              >
                <span className="material-symbols-outlined text-[18px]">description</span>
                <span>{activeDoc.pageTitle || 'Roadmap Q4'}</span>
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg text-sm transition-colors"
                type="button"
                onClick={() => navigate('/pages/new')}
              >
                <span className="material-symbols-outlined text-[18px]">description</span>
                <span>API Documentation</span>
              </button>
            </div>
            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg text-sm transition-colors" type="button">
              <span className="material-symbols-outlined text-[18px]">keyboard_arrow_right</span>
              <span className="material-symbols-outlined text-[18px]">folder</span>
              <span>Design System</span>
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg text-sm transition-colors" type="button">
              <span className="material-symbols-outlined text-[18px]">keyboard_arrow_right</span>
              <span className="material-symbols-outlined text-[18px]">folder</span>
              <span>Marketing</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-outline-variant">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-outline-variant bg-white flex items-center justify-center font-bold text-dev-indigo">
            N
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">Nikola T.</p>
            <p className="text-[11px] text-outline truncate">Pro Plan</p>
          </div>
          <button className="text-on-surface-variant hover:text-[#b42318]" type="button" onClick={onLogout}>
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

function SidebarItem({ active, icon, label, method, onClick }) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
        active ? 'bg-white text-on-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'
      }`}
      type="button"
      onClick={onClick}
    >
      {icon ? (
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      ) : (
        <span className={`w-9 text-[10px] font-bold ${methodClass(method)}`}>{method}</span>
      )}
      <span className="truncate">{label}</span>
    </button>
  )
}

function WorkspaceTopbar({ activeDoc, onLogout }) {
  return (
    <header className="h-16 px-8 border-b border-[#ececf0] flex items-center justify-between bg-white">
      <div className="min-w-0">
        <p className="text-xs text-on-surface-variant">Workspace</p>
        <h1 className="font-semibold text-base truncate">{activeDoc.workspaceName}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Saved
        </div>
        <button className="px-4 py-2 rounded-xl border border-[#e6e6ea] text-sm font-semibold hover:bg-[#f7f7f8]" type="button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}

function DashboardHome({ activeDoc, loading, workspaceList, selectedWorkspaceId, selectedWorkspace, navigate, onRefresh, onSelectWorkspace }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-on-surface-variant mb-2">Dashboard</p>
            <h2 className="text-3xl font-bold tracking-tight">Your workspaces</h2>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2.5 rounded-xl bg-[#1c1c1e] text-white text-sm font-semibold" type="button" onClick={() => navigate('/workspaces/new')}>
              New Workspace
            </button>
            <button className="px-4 py-2.5 rounded-xl border border-[#e6e6ea] text-sm font-semibold" type="button" onClick={() => navigate('/pages/new')}>
              New Page
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <section className="rounded-2xl border border-[#e6e6ea] bg-white">
            <div className="h-14 px-5 border-b border-[#ececf0] flex items-center justify-between">
              <h3 className="font-semibold">Workspace list</h3>
              <button className="text-sm text-dev-indigo font-semibold" type="button" onClick={onRefresh}>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            <div className="divide-y divide-[#ececf0]">
              {workspaceList.length === 0 ? (
                <div className="p-8 text-sm text-on-surface-variant">No workspaces yet. Create one to begin.</div>
              ) : (
                workspaceList.map((item) => {
                  const id = getId(item)
                  const active = id === selectedWorkspaceId
                  return (
                    <button
                      className={`w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-[#fafafa] ${active ? 'bg-[#f7f7fb]' : ''}`}
                      key={id || item.name}
                      type="button"
                      onClick={() => onSelectWorkspace(item)}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{item.name || 'Untitled workspace'}</p>
                        <p className="text-sm text-on-surface-variant truncate">{item.description || 'No description'}</p>
                      </div>
                      <span className="material-symbols-outlined text-outline">chevron_right</span>
                    </button>
                  )
                })
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[#e6e6ea] bg-white p-6">
            <p className="text-sm text-on-surface-variant mb-2">Selected</p>
            <h3 className="text-2xl font-bold mb-3">{selectedWorkspace?.name || activeDoc.workspaceName}</h3>
            <p className="text-sm leading-6 text-on-surface-variant">{selectedWorkspace?.description || activeDoc.pageContent}</p>
            <div className="mt-6 rounded-xl bg-[#f7f7f8] p-4 text-xs text-on-surface-variant break-all">
              {selectedWorkspaceId || 'No workspace selected'}
            </div>
          </section>
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
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="mb-8">
          <span className={`inline-flex mb-4 text-[11px] font-bold ${methodClass(method)}`}>{method}</span>
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          <p className="mt-2 text-on-surface-variant">{subtitle}</p>
        </div>
        <div className="rounded-2xl border border-[#e6e6ea] bg-white p-6">{children}</div>
      </div>
    </div>
  )
}

function AppleInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-on-surface-variant mb-2">{label}</span>
      <input
        className="w-full rounded-xl border border-[#e1e1e6] bg-white px-4 py-3 outline-none focus:border-[#1c1c1e]"
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
        className="px-5 py-3 rounded-xl bg-[#1c1c1e] text-white text-sm font-semibold disabled:opacity-60"
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

async function authedRequest(path, options = {}) {
  const token = readToken()
  return apiRequest(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}

function getId(item) {
  return item?._id || item?.id || ''
}

function methodClass(method) {
  if (method === 'POST') return 'text-[#a15c07]'
  if (method === 'GET') return 'text-[#067647]'
  if (method === 'PUT') return 'text-[#175cd3]'
  if (method === 'DEL') return 'text-[#b42318]'
  return 'text-outline'
}

function ensureStatusNode(form) {
  if (!form) return null

  let status = form.querySelector('[data-auth-status]')
  if (status) return status

  status = document.createElement('p')
  status.setAttribute('data-auth-status', 'true')
  status.className = 'mt-4 text-sm font-medium'
  status.style.minHeight = '1.25rem'
  form.insertAdjacentElement('afterend', status)
  return status
}

function setStatus(node, message, isError) {
  if (!node) return
  node.textContent = message
  node.style.color = isError ? '#b42318' : '#067647'
}

export default App
