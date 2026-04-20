import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:4000'
const CHAT_MANAGE_TOKEN_KEY = 'zama_chat_manage_token'
const DRAFT_TEXTAREA_MIN_PX = 44
const DRAFT_TEXTAREA_MAX_PX = 220

const readErrorMessage = async (response, fallbackMessage) => {
  try {
    const payload = await response.json()
    if (typeof payload?.message === 'string' && payload.message) {
      return payload.message
    }
  } catch {
    // Ignore body parse errors.
  }
  return fallbackMessage
}

function ChatManage() {
  const [token, setToken] = useState(() => localStorage.getItem(CHAT_MANAGE_TOKEN_KEY) ?? '')
  const [admin, setAdmin] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [sessionLoading, setSessionLoading] = useState(Boolean(token))
  const [stats, setStats] = useState(null)
  const [messages, setMessages] = useState([])
  const [dashboardError, setDashboardError] = useState('')
  const [dataLoading, setDataLoading] = useState(false)
  const [viewMode, setViewMode] = useState('table')
  const [deletingMessageId, setDeletingMessageId] = useState(null)
  const [draftMessage, setDraftMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const messagesListRef = useRef(null)
  const draftTextareaRef = useRef(null)
  const draftNewlineCaretRef = useRef(null)
  const stickToBottomRef = useRef(true)
  const pollInFlightAbortRef = useRef(null)

  const isLoggedIn = useMemo(() => Boolean(token && admin), [token, admin])
  const emailMessages = useMemo(
    () => messages.filter((row) => String(row?.id ?? '').startsWith('email_support:')),
    [messages]
  )

  const updateStickToBottomFromScroll = () => {
    const el = messagesListRef.current
    if (!el) return
    const thresholdPx = 72
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= thresholdPx
  }

  useLayoutEffect(() => {
    if (!isLoggedIn || viewMode !== 'chat') return
    const el = messagesListRef.current
    if (!el) return
    if (!stickToBottomRef.current) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoggedIn, viewMode])

  useLayoutEffect(() => {
    if (!isLoggedIn || viewMode !== 'chat') return
    const el = draftTextareaRef.current
    if (!el) return

    const caret = draftNewlineCaretRef.current
    if (caret !== null) {
      const pos = Math.min(caret, el.value.length)
      el.setSelectionRange(pos, pos)
      draftNewlineCaretRef.current = null
    }

    el.style.height = 'auto'
    const next = Math.min(Math.max(el.scrollHeight, DRAFT_TEXTAREA_MIN_PX), DRAFT_TEXTAREA_MAX_PX)
    el.style.height = `${next}px`
    el.style.overflowY = el.scrollHeight > DRAFT_TEXTAREA_MAX_PX ? 'auto' : 'hidden'
  }, [draftMessage, isLoggedIn, viewMode])

  const fetchDashboardData = async (activeToken, options = {}) => {
    const { signal, silent = false } = options
    if (!silent) {
      setDataLoading(true)
      setDashboardError('')
    }
    const headers = { Authorization: `Bearer ${activeToken}` }
    const [statsRes, messagesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/chat-manage/stats`, { headers, signal }),
      fetch(`${API_BASE_URL}/api/chat-manage/messages?limit=200`, { headers, signal }),
    ])
    if (!statsRes.ok) {
      throw new Error(await readErrorMessage(statsRes, 'Unable to load stats.'))
    }
    if (!messagesRes.ok) {
      throw new Error(await readErrorMessage(messagesRes, 'Unable to load messages.'))
    }
    const statsPayload = await statsRes.json()
    const messagesPayload = await messagesRes.json()
    setStats(statsPayload?.data ?? null)
    setMessages(Array.isArray(messagesPayload?.data) ? messagesPayload.data : [])
    if (!silent) {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (!token) {
      setAdmin(null)
      setSessionLoading(false)
      return undefined
    }

    let ignore = false
    const ac = new AbortController()

    const loadSession = async () => {
      setSessionLoading(true)
      setLoginError('')
      try {
        const response = await fetch(`${API_BASE_URL}/api/chat-manage/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ac.signal,
        })
        if (!response.ok) {
          throw new Error(await readErrorMessage(response, 'Session expired. Please sign in again.'))
        }
        const payload = await response.json()
        if (!payload?.data?.admin) {
          throw new Error('Invalid session response.')
        }
        if (!ignore) {
          setAdmin(payload.data.admin)
        }
      } catch (error) {
        if (error?.name === 'AbortError') return
        if (!ignore) {
          setToken('')
          setAdmin(null)
          localStorage.removeItem(CHAT_MANAGE_TOKEN_KEY)
          setLoginError(error instanceof Error ? error.message : 'Unable to restore session.')
        }
      } finally {
        if (!ignore) {
          setSessionLoading(false)
        }
      }
    }

    void loadSession()
    return () => {
      ignore = true
      ac.abort()
    }
  }, [token])

  useEffect(() => {
    if (!isLoggedIn) return undefined

    let ignore = false
    const ac = new AbortController()

    const loadDashboard = async () => {
      try {
        await fetchDashboardData(token, { signal: ac.signal })
      } catch (error) {
        if (error?.name === 'AbortError') return
        if (!ignore) {
          setDashboardError(error instanceof Error ? error.message : 'Unable to load dashboard.')
          setDataLoading(false)
        }
      }
    }

    void loadDashboard()
    return () => {
      ignore = true
      ac.abort()
    }
  }, [token, isLoggedIn])

  useEffect(() => {
    if (!selectedMessage) return undefined

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSelectedMessage(null)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [selectedMessage])

  useEffect(() => {
    if (!isLoggedIn) return undefined

    const pollOnce = async () => {
      pollInFlightAbortRef.current?.abort()
      const ac = new AbortController()
      pollInFlightAbortRef.current = ac
      try {
        await fetchDashboardData(token, { signal: ac.signal, silent: true })
      } catch (error) {
        if (error?.name === 'AbortError') return
        // Keep polling silent to avoid UI noise.
      }
    }

    const intervalId = window.setInterval(pollOnce, 3000)

    return () => {
      pollInFlightAbortRef.current?.abort()
      pollInFlightAbortRef.current = null
      window.clearInterval(intervalId)
    }
  }, [token, isLoggedIn])

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-manage/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Unable to sign in.'))
      }
      const payload = await response.json()
      const nextToken = payload?.data?.token
      const nextAdmin = payload?.data?.admin
      if (!nextToken || !nextAdmin?.email) {
        throw new Error('Invalid login response.')
      }
      setToken(nextToken)
      setAdmin(nextAdmin)
      localStorage.setItem(CHAT_MANAGE_TOKEN_KEY, nextToken)
      setPassword('')
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    setToken('')
    setAdmin(null)
    setStats(null)
    setMessages([])
    setDraftMessage('')
    setSelectedMessage(null)
    localStorage.removeItem(CHAT_MANAGE_TOKEN_KEY)
  }

  const handleDeleteMessage = async (messageId) => {
    if (!token) return
    setDashboardError('')
    setDeletingMessageId(messageId)
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-manage/messages/${encodeURIComponent(messageId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Unable to delete message.'))
      }
      const payload = await response.json()
      setMessages(Array.isArray(payload?.data) ? payload.data : [])
      if (payload?.stats) {
        setStats(payload.stats)
      }
      setSelectedMessage((current) => (current?.id === messageId ? null : current))
      stickToBottomRef.current = true
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Unable to delete message.')
    } finally {
      setDeletingMessageId(null)
    }
  }

  const handleSendSupportMessage = async (event) => {
    event.preventDefault()
    if (!token || sendingMessage || !draftMessage.trim()) return

    setDashboardError('')
    setSendingMessage(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-manage/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: draftMessage }),
      })
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Unable to send support message.'))
      }
      const payload = await response.json()
      setMessages(Array.isArray(payload?.data) ? payload.data : [])
      if (payload?.stats) {
        setStats(payload.stats)
      }
      stickToBottomRef.current = true
      setDraftMessage('')
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Unable to send support message.')
    } finally {
      setSendingMessage(false)
    }
  }

  const openMessageModal = (message) => {
    setSelectedMessage(message)
  }

  const closeMessageModal = () => {
    setSelectedMessage(null)
  }

  const handleDraftKeyDown = (event) => {
    if (event.key !== 'Enter') return
    if (event.nativeEvent.isComposing) return
    const el = event.currentTarget

    if (event.ctrlKey) {
      event.preventDefault()
      const start = el.selectionStart ?? 0
      const end = el.selectionEnd ?? 0
      const replacedLen = end - start
      if (draftMessage.length - replacedLen + 1 > 2000) return
      draftNewlineCaretRef.current = start + 1
      setDraftMessage((prev) => `${prev.slice(0, start)}\n${prev.slice(end)}`)
      return
    }

    if (event.shiftKey) return
    event.preventDefault()
    void handleSendSupportMessage(event)
  }

  function parseEmailSupportPreview(messageText) {
    const text = String(messageText ?? '')
    const lines = text.split('\n')
    const firstLine = lines[0] ?? ''
    const fromLine = lines[1] ?? ''
    const body = lines.slice(3).join('\n').trim()
    const fromRaw = fromLine.replace(/^From:\s*/i, '').trim()

    let senderName = fromRaw
    let senderEmail = ''
    const namedEmailMatch = fromRaw.match(/^(.*?)\s*<([^>]+)>$/)
    if (namedEmailMatch) {
      senderName = namedEmailMatch[1].trim() || namedEmailMatch[2].trim()
      senderEmail = namedEmailMatch[2].trim()
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromRaw)) {
      senderName = ''
      senderEmail = fromRaw
    }

    return {
      subject: firstLine.replace(/^\[Email Support\]\s*/i, '').trim() || '(No subject)',
      senderName: senderName || '(Unknown sender)',
      senderEmail,
      from: fromRaw,
      body: body || text,
    }
  }

  const selectedMessageIsEmail = String(selectedMessage?.id ?? '').startsWith('email_support:')
  const selectedEmailPreview = selectedMessageIsEmail ? parseEmailSupportPreview(selectedMessage?.message) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-black text-zinc-100">
      <header className="border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white sm:text-xl">Chat management</h1>
            <p className="text-xs text-zinc-500 sm:text-sm">Group chat overview (admin)</p>
          </div>
          <Link
            to="/"
            className="rounded-lg border border-white/15 px-3 py-2 text-sm text-zinc-300 transition hover:border-lime-300/40 hover:text-lime-200"
          >
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {sessionLoading ? (
          <p className="text-center text-sm text-zinc-400">Checking session…</p>
        ) : !isLoggedIn ? (
          <section className="mx-auto max-w-md rounded-2xl border border-white/10 bg-zinc-900/60 p-6 shadow-xl shadow-black/40 backdrop-blur sm:p-8">
            <h2 className="mb-1 text-base font-semibold text-white">Sign in</h2>
            <p className="mb-6 text-sm text-zinc-400">Use your chat admin credentials.</p>
            <form onSubmit={handleLogin} className="grid gap-4">
              <label className="grid gap-2 text-sm text-zinc-300">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-zinc-100 outline-none focus:border-lime-300/40"
                  placeholder="admin@example.com"
                />
              </label>
              <label className="grid gap-2 text-sm text-zinc-300">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-zinc-100 outline-none focus:border-lime-300/40"
                />
              </label>
              <button
                type="submit"
                disabled={loginLoading}
                className="mt-1 rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-lime-200 disabled:opacity-50"
              >
                {loginLoading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            {loginError ? (
              <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {loginError}
              </p>
            ) : null}
          </section>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-zinc-400">
                Signed in as <span className="font-medium text-lime-200">{admin.email}</span>
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-zinc-300 transition hover:border-rose-400/40 hover:text-rose-200"
              >
                Sign out
              </button>
            </div>

            {dashboardError ? (
              <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {dashboardError}
              </p>
            ) : null}

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Chat accounts</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-white">
                  {dataLoading ? '—' : stats?.chatUserCount ?? '—'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Messages stored</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-white">
                  {dataLoading ? '—' : stats?.messageCount ?? '—'}
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Recent messages</h2>
                <div className="inline-flex rounded-xl border border-white/10 bg-zinc-900/70 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      viewMode === 'table'
                        ? 'bg-lime-300 text-zinc-900'
                        : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Table view
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('chat')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      viewMode === 'chat'
                        ? 'bg-lime-300 text-zinc-900'
                        : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Chat view
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('email')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      viewMode === 'email'
                        ? 'bg-lime-300 text-zinc-900'
                        : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Email
                  </button>
                </div>
              </div>

              {viewMode === 'table' ? (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40">
                  <div className="chat-scrollbar-hidden max-h-[min(70vh,560px)] overflow-auto">
                    <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                      <thead className="sticky top-0 z-10 bg-zinc-900/95 text-xs uppercase tracking-wide text-zinc-500">
                        <tr>
                          <th className="border-b border-white/10 px-3 py-3 font-medium">ID</th>
                          <th className="border-b border-white/10 px-3 py-3 font-medium">From</th>
                          <th className="border-b border-white/10 px-3 py-3 font-medium">Time</th>
                          <th className="border-b border-white/10 px-3 py-3 font-medium">Message</th>
                          <th className="border-b border-white/10 px-3 py-3 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-zinc-200">
                        {messages.length === 0 && !dataLoading ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-8 text-center text-zinc-500">
                              No messages yet.
                            </td>
                          </tr>
                        ) : (
                          messages.map((row) => (
                            <tr key={row.id} className="border-b border-white/5 align-top hover:bg-white/[0.03]">
                              <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-zinc-500">{row.id}</td>
                              <td className="whitespace-nowrap px-3 py-2 text-violet-200/90">{row.displayId}</td>
                              <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-500">
                                {new Date(row.createdAt).toLocaleString()}
                              </td>
                              <td className="max-w-md px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => openMessageModal(row)}
                                  className="group block w-full rounded-md text-left outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-lime-300/35"
                                  aria-label={`Open message ${row.id} detail`}
                                >
                                  <span className="line-clamp-4 whitespace-pre-wrap break-words text-zinc-300 transition group-hover:text-zinc-100">
                                    {row.message}
                                  </span>
                                </button>
                              </td>
                              <td className="whitespace-nowrap px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(row.id)}
                                  disabled={deletingMessageId !== null}
                                  className="rounded-md border border-rose-500/35 px-2 py-1 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                                  aria-label={`Delete message ${row.id}`}
                                >
                                  {deletingMessageId === row.id ? 'Deleting…' : 'Delete'}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : viewMode === 'chat' ? (
                <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-3 sm:p-4">
                  <div
                    ref={messagesListRef}
                    onScroll={updateStickToBottomFromScroll}
                    className="chat-scrollbar-hidden flex max-h-[min(70vh,560px)] min-h-[360px] flex-col overflow-y-auto overflow-x-hidden rounded-2xl bg-zinc-950/50 px-2 py-3 ring-1 ring-inset ring-white/5"
                  >
                    {messages.length === 0 && !dataLoading ? (
                      <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-zinc-500">
                        No messages yet.
                      </p>
                    ) : (
                      <ul className="mt-auto flex flex-col gap-0.5">
                        {messages.map((item, index) => {
                          const prev = index > 0 ? messages[index - 1] : null
                          const stackedWithPrev = Boolean(prev && prev.displayId === item.displayId)
                          const isRight = item.displayId === 'Support Team'
                          const timeLabel = new Date(item.createdAt).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })

                          return (
                            <li
                              key={item.id}
                              className={`flex w-full ${isRight ? 'justify-end' : 'justify-start'} ${
                                stackedWithPrev ? 'mt-0.5' : 'mt-3 first:mt-0'
                              }`}
                            >
                              <div
                                className={`flex max-w-[min(100%,22rem)] flex-col sm:max-w-[min(100%,26rem)] ${
                                  isRight ? 'items-end' : 'items-start'
                                }`}
                              >
                                <div className="mb-1 flex max-w-full flex-wrap items-center gap-1.5 px-1">
                                  <span className="truncate text-[11px] font-semibold text-violet-200/90 sm:text-xs">
                                    {item.displayId}
                                  </span>
                                </div>
                                <div
                                  className={`relative rounded-2xl px-3.5 py-2 shadow-sm ${
                                    isRight
                                      ? 'rounded-br-md bg-[#3d4a6b]/95 text-zinc-50 ring-1 ring-[#7b8fd4]/25'
                                      : 'rounded-bl-md bg-zinc-800/90 text-zinc-100 ring-1 ring-white/10'
                                  }`}
                                >
                                  <p className="m-0 whitespace-pre-wrap break-words text-[13px] leading-relaxed sm:text-sm">
                                    {item.message}
                                  </p>
                                  <div className={`mt-1.5 flex ${isRight ? 'justify-end' : 'justify-start'}`}>
                                    <span
                                      className={`text-[10px] tabular-nums sm:text-[11px] ${
                                        isRight ? 'text-zinc-300/80' : 'text-zinc-500'
                                      }`}
                                    >
                                      {timeLabel}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMessage(item.id)}
                                      disabled={deletingMessageId !== null}
                                      className="ml-2 rounded-md border border-rose-500/35 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                                      aria-label={`Delete message ${item.id}`}
                                    >
                                      {deletingMessageId === item.id ? '…' : 'Delete'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                  <div className="mt-3 border-t border-white/5 pt-3">
                    <form onSubmit={handleSendSupportMessage} className="flex items-end gap-2">
                      <textarea
                        ref={draftTextareaRef}
                        value={draftMessage}
                        onChange={(event) => setDraftMessage(event.target.value)}
                        onKeyDown={handleDraftKeyDown}
                        maxLength={2000}
                        rows={1}
                        placeholder="Send as Support Team"
                        className="chat-scrollbar-hidden box-border min-h-[2.75rem] w-full min-w-0 flex-1 resize-none rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-2.5 text-sm leading-relaxed text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-[#8b9fe8]/40"
                      />
                      <button
                        type="submit"
                        disabled={sendingMessage || !draftMessage.trim()}
                        aria-label="Send support message"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2d3344] text-[#c8ccef] shadow-md transition hover:bg-[#383f54] hover:text-[#e4e6ff] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <span className="text-sm">➤</span>
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40">
                  <div className="chat-scrollbar-hidden max-h-[min(70vh,560px)] overflow-auto">
                    <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                      <thead className="sticky top-0 z-10 bg-zinc-900/95 text-xs uppercase tracking-wide text-zinc-500">
                        <tr>
                          <th className="border-b border-white/10 px-3 py-3 font-medium">ID</th>
                          <th className="border-b border-white/10 px-3 py-3 font-medium">Name</th>
                          <th className="border-b border-white/10 px-3 py-3 font-medium">Email</th>
                          <th className="border-b border-white/10 px-3 py-3 font-medium">Time</th>
                          <th className="border-b border-white/10 px-3 py-3 font-medium">Subject</th>
                          <th className="border-b border-white/10 px-3 py-3 font-medium">Preview</th>
                          <th className="border-b border-white/10 px-3 py-3 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-zinc-200">
                        {emailMessages.length === 0 && !dataLoading ? (
                          <tr>
                            <td colSpan={7} className="px-3 py-8 text-center text-zinc-500">
                              No email support messages yet.
                            </td>
                          </tr>
                        ) : (
                          emailMessages.map((row) => {
                            const preview = parseEmailSupportPreview(row.message)
                            return (
                              <tr key={row.id} className="border-b border-white/5 align-top hover:bg-white/[0.03]">
                                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-zinc-500">{row.id}</td>
                                <td className="max-w-[14rem] px-3 py-2 text-violet-200/90">
                                  <span className="block truncate">{preview.senderName || row.displayId}</span>
                                </td>
                                <td className="max-w-[16rem] px-3 py-2 text-zinc-300">
                                  <span className="block truncate">{preview.senderEmail || '-'}</span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-500">
                                  {new Date(row.createdAt).toLocaleString()}
                                </td>
                                <td className="max-w-[16rem] px-3 py-2">
                                  <button
                                    type="button"
                                    onClick={() => openMessageModal(row)}
                                    className="group block w-full rounded-md text-left outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-lime-300/35"
                                    aria-label={`Open email message ${row.id} detail`}
                                  >
                                    <span className="line-clamp-2 whitespace-pre-wrap break-words font-medium text-zinc-200 transition group-hover:text-zinc-100">
                                      {preview.subject}
                                    </span>
                                  </button>
                                </td>
                                <td className="max-w-[22rem] px-3 py-2">
                                  <span className="line-clamp-3 whitespace-pre-wrap break-words text-zinc-300">
                                    {preview.body}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-2">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMessage(row.id)}
                                    disabled={deletingMessageId !== null}
                                    className="rounded-md border border-rose-500/35 px-2 py-1 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label={`Delete message ${row.id}`}
                                  >
                                    {deletingMessageId === row.id ? 'Deleting…' : 'Delete'}
                                  </button>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
          selectedMessage
            ? 'pointer-events-auto bg-black/65 opacity-100 backdrop-blur-[2px]'
            : 'pointer-events-none bg-black/0 opacity-0 backdrop-blur-0'
        }`}
        onClick={closeMessageModal}
        role="presentation"
      >
        <section
          className={`w-full max-w-3xl rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-5 shadow-2xl shadow-black/70 transition-all duration-300 sm:p-6 ${
            selectedMessage ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-95 opacity-0'
          }`}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="message-detail-title"
        >
          <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <p className="mb-1 inline-flex rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
                {selectedMessageIsEmail ? 'Email Support' : 'Chat Message'}
              </p>
              <h3 id="message-detail-title" className="text-base font-semibold text-white sm:text-xl">
                {selectedMessageIsEmail ? 'Email support detail' : 'Message detail'}
              </h3>
              <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                From {selectedMessageIsEmail ? (selectedEmailPreview?.senderName ?? '-') : (selectedMessage?.displayId ?? '-')} at{' '}
                {selectedMessage ? new Date(selectedMessage.createdAt).toLocaleString() : '-'}
              </p>
            </div>
            <button
              type="button"
              onClick={closeMessageModal}
              className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-white/30 hover:bg-white/5 hover:text-white"
              aria-label="Close message detail"
            >
              Close
            </button>
          </div>
          {selectedMessageIsEmail ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-zinc-950/80 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">Sender Name</p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-100 sm:text-[15px]">
                    {selectedEmailPreview?.senderName || '-'}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-950/80 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">Sender Email</p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-100 sm:text-[15px]">
                    {selectedEmailPreview?.senderEmail || '-'}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-zinc-950/80 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Subject</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold leading-relaxed text-zinc-100 sm:text-[15px]">
                  {selectedEmailPreview?.subject ?? '(No subject)'}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-zinc-950/80 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Message</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-100 sm:text-[15px]">
                  {selectedEmailPreview?.body ?? ''}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-zinc-950/80 px-4 py-4">
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-100 sm:text-[15px]">
                {selectedMessage?.message ?? ''}
              </p>
            </div>
          )}
          <p className="mt-3 text-[11px] text-zinc-500 sm:text-xs">
            Press <kbd className="rounded border border-white/20 px-1.5 py-0.5 text-zinc-300">Esc</kbd> to close.
          </p>
        </section>
      </div>
    </div>
  )
}

export default ChatManage
