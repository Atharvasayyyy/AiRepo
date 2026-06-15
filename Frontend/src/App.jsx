import { useEffect, useMemo, useState } from 'react'
import { pageHtml } from './pageHtml'
import { apiRequest, saveToken } from './lib/api'

const routes = {
  '/': 'landing',
  '/login': 'login',
  '/signup': 'signup',
}

function getRoute() {
  return routes[window.location.pathname] ?? 'landing'
}

function App() {
  const [page, setPage] = useState(getRoute)

  useEffect(() => {
    const onPopState = () => setPage(getRoute())
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
          : 'bg-background text-on-background min-h-screen flex flex-col font-body-md transition-colors duration-300'

    const title = {
      landing: 'DevHub | Organize Notes, Documents and Ideas',
      login: 'DevNotes - Sign In',
      signup: 'Sign Up | DevNotes',
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
        if (href && routes[href]) {
          event.preventDefault()
          window.history.pushState({}, '', href)
          setPage(routes[href])
          window.scrollTo(0, 0)
        }
        return
      }

      const button = target.closest('button')
      if (!button) return

      const text = button.textContent.replace(/\s+/g, ' ').trim()
      if (text === 'Login') {
        window.history.pushState({}, '', '/login')
        setPage('login')
        window.scrollTo(0, 0)
      }
      if (['Get Started', 'Get Started Free', 'Start For Free'].includes(text)) {
        window.history.pushState({}, '', '/signup')
        setPage('signup')
        window.scrollTo(0, 0)
      }
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  usePageBehavior(page)

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

      setStatus(statusNode, 'Login successful. Token saved in localStorage.', false)
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
