import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:4000'
const CHAT_TOKEN_STORAGE_KEY = 'zama_group_chat_token'

const DRAFT_TEXTAREA_MIN_PX = 44
const DRAFT_TEXTAREA_MAX_PX = 220

const readErrorMessage = async (response, fallbackMessage) => {
  try {
    const payload = await response.json()
    if (typeof payload?.message === 'string' && payload.message) {
      return payload.message
    }
  } catch {
    // Ignore body parse errors and return fallback text.
  }
  return fallbackMessage
}

function SendPlaneIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 2L11 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 2L15 22L11 13L2 9L22 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function GroupChat({ isSidePanel = false }) {
  const [authMode, setAuthMode] = useState('signup')
  const [email, setEmail] = useState('')
  const [displayId, setDisplayId] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState(() => localStorage.getItem(CHAT_TOKEN_STORAGE_KEY) ?? '')
  const [user, setUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [draftMessage, setDraftMessage] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [messageError, setMessageError] = useState('')

  const messagesListRef = useRef(null)
  const draftTextareaRef = useRef(null)
  const draftNewlineCaretRef = useRef(null)
  const stickToBottomRef = useRef(true)
  const pollInFlightAbortRef = useRef(null)

  const isAuthenticated = useMemo(() => Boolean(token && user), [token, user])

  const updateStickToBottomFromScroll = () => {
    const el = messagesListRef.current
    if (!el) return
    const thresholdPx = 72
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= thresholdPx
  }

  useLayoutEffect(() => {
    if (!isAuthenticated) return
    const el = messagesListRef.current
    if (!el) return
    if (!stickToBottomRef.current) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, isAuthenticated])

  useLayoutEffect(() => {
    if (!isAuthenticated) return
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
  }, [draftMessage, isAuthenticated])

  const fetchMessages = async (activeToken, options = {}) => {
    const { signal } = options
    setMessageError('')
    const response = await fetch(`${API_BASE_URL}/api/chat/messages?limit=120`, {
      headers: {
        Authorization: `Bearer ${activeToken}`,
      },
      signal,
    })

    if (!response.ok) {
      const responseMessage = await readErrorMessage(response, 'Unable to load chat messages.')
      throw new Error(responseMessage)
    }

    const payload = await response.json()
    if (!Array.isArray(payload?.data)) {
      throw new Error('Invalid chat response shape.')
    }
    setMessages(payload.data)
  }

  useEffect(() => {
    let ignore = false
    const sessionAbort = new AbortController()

    if (!token) {
      setUser(null)
      setMessages([])
      return undefined
    }

    const loadChatSession = async () => {
      setMessagesLoading(true)
      setAuthError('')

      try {
        const meResponse = await fetch(`${API_BASE_URL}/api/chat/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: sessionAbort.signal,
        })

        if (!meResponse.ok) {
          throw new Error(await readErrorMessage(meResponse, 'Session expired. Please log in again.'))
        }

        const mePayload = await meResponse.json()
        if (!mePayload?.data?.user) {
          throw new Error('Invalid session response shape.')
        }

        if (!ignore) {
          setUser(mePayload.data.user)
          await fetchMessages(token, { signal: sessionAbort.signal })
        }
      } catch (error) {
        if (error?.name === 'AbortError') return
        if (!ignore) {
          const message = error instanceof Error ? error.message : 'Unable to restore chat session.'
          setAuthError(message)
          setToken('')
          setUser(null)
          setMessages([])
          localStorage.removeItem(CHAT_TOKEN_STORAGE_KEY)
        }
      } finally {
        if (!ignore) {
          setMessagesLoading(false)
        }
      }
    }

    loadChatSession()

    return () => {
      ignore = true
      sessionAbort.abort()
    }
  }, [token])

  useEffect(() => {
    if (!isAuthenticated) return undefined

    const pollOnce = async () => {
      pollInFlightAbortRef.current?.abort()
      const ac = new AbortController()
      pollInFlightAbortRef.current = ac
      try {
        await fetchMessages(token, { signal: ac.signal })
      } catch (error) {
        if (error?.name === 'AbortError') return
        // Silent background refresh failures to avoid noisy UI.
      }
    }

    const intervalId = window.setInterval(pollOnce, 3000)

    return () => {
      pollInFlightAbortRef.current?.abort()
      pollInFlightAbortRef.current = null
      window.clearInterval(intervalId)
    }
  }, [isAuthenticated, token])

  const handleSubmitAuth = async (event) => {
    event.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    try {
      const endpoint = authMode === 'signup' ? '/api/chat/signup' : '/api/chat/login'
      const body =
        authMode === 'signup'
          ? { email, displayId, password }
          : {
              email,
              password,
            }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Unable to authenticate chat user.'))
      }

      const payload = await response.json()
      const nextToken = payload?.data?.token
      const nextUser = payload?.data?.user

      if (!nextToken || !nextUser) {
        throw new Error('Invalid authentication response shape.')
      }

      setToken(nextToken)
      setUser(nextUser)
      localStorage.setItem(CHAT_TOKEN_STORAGE_KEY, nextToken)
      setPassword('')
      setDraftMessage('')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to authenticate chat user.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSendMessage = async (event) => {
    event.preventDefault()
    if (!isAuthenticated || !draftMessage.trim()) return

    setMessageError('')
    setMessagesLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: draftMessage }),
      })

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Unable to send group chat message.'))
      }

      const payload = await response.json()
      if (!Array.isArray(payload?.data)) {
        throw new Error('Invalid chat response shape.')
      }

      stickToBottomRef.current = true
      setMessages(payload.data)
      setDraftMessage('')
    } catch (error) {
      setMessageError(error instanceof Error ? error.message : 'Unable to send group chat message.')
    } finally {
      setMessagesLoading(false)
    }
  }

  const handleDraftKeyDown = (event) => {
    if (event.key !== 'Enter') return
    if (event.nativeEvent.isComposing) return

    const el = event.currentTarget

    // Ctrl+Enter: browsers usually do not insert a newline; insert explicitly.
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

    // Shift+Enter: native newline
    if (event.shiftKey) return

    event.preventDefault()
    if (!isAuthenticated || messagesLoading || !draftMessage.trim()) return
    void handleSendMessage(event)
  }

  const handleLogout = () => {
    setToken('')
    setUser(null)
    setMessages([])
    setDraftMessage('')
    localStorage.removeItem(CHAT_TOKEN_STORAGE_KEY)
  }

  return (
    <section
      className={`mx-auto flex w-full flex-col text-zinc-100 ${isSidePanel ? 'min-h-0 flex-1 px-1 py-2' : 'max-w-5xl px-2 py-6'}`}
    >

      {!isAuthenticated ? (
        <section className="rounded-2xl border border-white/10 bg-zinc-950/80 p-6 backdrop-blur">
          <div className="mb-5 flex gap-2 rounded-xl bg-zinc-900/70 p-1">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              disabled={authMode === 'login'}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                authMode === 'login'
                  ? 'bg-lime-300 text-zinc-900'
                  : 'text-zinc-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              disabled={authMode === 'signup'}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                authMode === 'signup'
                  ? 'bg-lime-300 text-zinc-900'
                  : 'text-zinc-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmitAuth} className="grid gap-4">
            <label className="grid gap-2 text-sm text-zinc-300">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none transition focus:border-lime-300/50"
                placeholder="you@example.com"
              />
            </label>

            {authMode === 'signup' ? (
              <label className="grid gap-2 text-sm text-zinc-300">
                <span>ID to show in chat</span>
                <input
                  type="text"
                  value={displayId}
                  onChange={(event) => setDisplayId(event.target.value)}
                  minLength={3}
                  maxLength={30}
                  required
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none transition focus:border-lime-300/50"
                  placeholder="Your public chat ID"
                />
              </label>
            ) : null}

            <label className="grid gap-2 text-sm text-zinc-300">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none transition focus:border-lime-300/50"
                placeholder="At least 6 characters"
              />
            </label>

            <button
              type="submit"
              disabled={authLoading}
              className="mt-1 inline-flex items-center justify-center rounded-lg bg-lime-300 px-4 py-2 font-medium text-zinc-900 transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {authLoading ? 'Please wait...' : authMode === 'signup' ? 'Create account' : 'Login'}
            </button>
          </form>

          {authError ? (
            <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {authError}
            </p>
          ) : null}
        </section>
      ) : null}

      {isAuthenticated ? (
        <section
          className={`flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 p-4 shadow-lg shadow-black/20 backdrop-blur sm:p-3 ${isSidePanel ? '' : 'min-h-[min(70vh,720px)]'}`}
        >
          <div className="mb-3 shrink-0 flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
            <p className="text-xs text-zinc-400 sm:text-sm">
              <span className="text-zinc-500">You are </span>
              <span className="font-semibold text-lime-200/95">{user.displayId}</span>
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-200 sm:text-sm"
            >
              Logout
            </button>
          </div>

          {messageError ? (
            <p className="mb-2 shrink-0 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 sm:text-sm">
              {messageError}
            </p>
          ) : null}

          <div
            ref={messagesListRef}
            onScroll={updateStickToBottomFromScroll}
            className={`chat-scrollbar-hidden flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-2xl bg-zinc-950/50 px-2 py-3 ring-1 ring-inset ring-white/5 ${isSidePanel ? '' : 'max-h-[540px] min-h-[280px]'}`}
          >
            {messages.length === 0 ? (
              <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-zinc-500">
                {messagesLoading ? 'Loading chat…' : 'No messages yet. Say hello.'}
              </p>
            ) : (
              <ul className="mt-auto flex flex-col gap-0.5">
                {messages.map((item, index) => {
                  const isOwn = item.displayId === user.displayId
                  const prev = index > 0 ? messages[index - 1] : null
                  const stackedWithPrev = Boolean(prev && prev.displayId === item.displayId)
                  const timeLabel = new Date(item.createdAt).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })

                  return (
                    <li
                      key={item.id}
                      className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} ${stackedWithPrev ? 'mt-0.5' : 'mt-3 first:mt-0'}`}
                    >
                      <div
                        className={`flex max-w-[min(100%,20rem)] flex-col sm:max-w-[min(100%,24rem)] ${isOwn ? 'items-end' : 'items-start'}`}
                      >
                        {!isOwn ? (
                          <div className="mb-1 flex max-w-full flex-wrap items-center gap-1.5 px-1">
                            <span className="truncate text-[11px] font-semibold text-violet-200/90 sm:text-xs">
                              {item.displayId}
                            </span>
                          </div>
                        ) : null}
                        <div
                          className={`relative rounded-2xl px-3.5 py-2 shadow-sm ${
                            isOwn
                              ? 'rounded-br-md bg-[#3d4a6b]/95 text-zinc-50 ring-1 ring-[#7b8fd4]/25'
                              : 'rounded-bl-md bg-zinc-800/90 text-zinc-100 ring-1 ring-white/10'
                          }`}
                        >
                          <p className="m-0 whitespace-pre-wrap break-words text-[13px] leading-relaxed sm:text-sm">
                            {item.message}
                          </p>
                          <div className={`mt-1.5 flex flex-wrap items-center ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <span className={`text-[10px] tabular-nums sm:text-[11px] ${isOwn ? 'text-zinc-300/80' : 'text-zinc-500'}`}>
                              {timeLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <form
            onSubmit={handleSendMessage}
            className="mt-3 shrink-0 border-t border-white/5 pt-3"
          >
            <div className="flex items-end gap-2">
              <label className="sr-only" htmlFor="group-chat-draft">
                Message
              </label>
              <textarea
                ref={draftTextareaRef}
                id="group-chat-draft"
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                onKeyDown={handleDraftKeyDown}
                placeholder="Message"
                maxLength={2000}
                rows={1}
                autoComplete="off"
                spellCheck
                className="box-border min-h-[2.75rem] w-full min-w-0 flex-1 resize-none rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-2.5 text-sm leading-relaxed text-zinc-100 shadow-inner outline-none ring-0 transition placeholder:text-zinc-500 focus:border-[#8b9fe8]/40 focus:bg-zinc-900"
              />
              <button
                type="submit"
                disabled={messagesLoading || !draftMessage.trim()}
                aria-label="Send message"
                title="Send"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2d3344] text-[#c8ccef] shadow-md transition hover:bg-[#383f54] hover:text-[#e4e6ff] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <SendPlaneIcon className="h-[1.15rem] w-[1.15rem] translate-x-px -translate-y-px" />
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </section>
  )
}

export default GroupChat
