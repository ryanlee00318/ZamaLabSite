import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import Spline from '@splinetool/react-spline'
import backgroundImage from '../assets/background.png'
import logoGif from '../assets/logo.gif'
import tLogo from '../assets/t-logo.png'
import { setupTemCashPartnersCarousel } from '../lib/temCashPartnersCarousel'
import GroupChat from './GroupChat'
import '../styles/ZamaTrustedPartners.css'
import '../styles/ZamaHeader.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:4000'
const COINGECKO_SIMPLE_PRICE_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,zama&vs_currencies=usd'
const A = (name) => `/tem-cash-assets/${name}`

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

/** Same order and duplicates as https://tem.cash/ footer markup. */
const TRUSTED_PARTNER_SLIDES = [
  { href: 'https://swft.pro', img: 'swiftpro.svg' },
  { href: 'https://changelly.com/', img: 'changelly.svg' },
  { href: 'https://just.money/?from=TEM&n=TRON&t=swap&to=TRX', img: 'justmoney.svg' },
  { href: 'https://tronql.com', img: 'tronql.svg' },
  { href: 'https://swft.pro', img: 'swiftpro.svg' },
  { href: 'https://changelly.com/', img: 'changelly.svg' },
  { href: 'https://just.money/?from=TEM&n=TRON&t=swap&to=TRX', img: 'justmoney.svg' },
  { href: 'https://tronql.com', img: 'tronql.svg' },
]

const OPERATOR_ICON_PATHS = {
  Conduit: '/zama-operator-icons/conduit.png',
  InfStones: '/zama-operator-icons/infstones.png',
  Artifact: '/zama-operator-icons/artifact.png',
  Blockscape: '/zama-operator-icons/blockscape.png',
  Luganodes: '/zama-operator-icons/luganodes.png',
  P2P: '/zama-operator-icons/p2p.png',
  Unit410: '/zama-operator-icons/unit410.png',
  Figment: '/zama-operator-icons/figment.png',
  'Zama (Coprocessor)': '/zama-operator-icons/zama.png',
  Omakase: '/zama-operator-icons/omakase.png',
  Etherscan: '/zama-operator-icons/etherscan.png',
  Ledger: '/zama-operator-icons/ledger.png',
  LayerZero: '/zama-operator-icons/layerzero.png',
  'Stake Capital': '/zama-operator-icons/stake-capital.png',
  Dfns: '/zama-operator-icons/dfns.png',
  Fireblocks: '/zama-operator-icons/fireblocks.png',
  OpenZeppelin: '/zama-operator-icons/openzeppelin.png',
  'Zama (KMS)': '/zama-operator-icons/zama.png',
}

const getOperatorIconUrl = (operatorName) => {
  return OPERATOR_ICON_PATHS[operatorName] ?? null
}

const SORTABLE_COLUMNS = [
  { key: 'operator', label: 'Operator' },
  { key: 'role', label: 'Role' },
  { key: 'apr', label: 'APR' },
  { key: 'totalRewards', label: 'Total Rewards' },
  { key: 'totalStake', label: 'Total Stake' },
  { key: 'commission', label: 'Commission' },
]

const parseSortValue = (value) => {
  if (typeof value !== 'string') return value
  const normalized = value.trim()
  if (normalized === '-') return null
  if (normalized.endsWith('%')) return Number.parseFloat(normalized.replace('%', ''))
  if (normalized.endsWith('M')) return Number.parseFloat(normalized.replace('M', ''))
  return normalized.toLowerCase()
}

const formatRemainingDuration = (unlockEndAt, nowTimestamp) => {
  const endTimestamp = Date.parse(unlockEndAt)
  if (!Number.isFinite(endTimestamp)) return '-'

  const remainingMs = Math.max(0, endTimestamp - nowTimestamp)
  const totalSeconds = Math.floor(remainingMs / 1000)

  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const formatHistoryWallet = (wallet) => {
  if (typeof wallet !== 'string' || wallet.length < 12) return wallet ?? '-'
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
}

const formatHistoryNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }
  if (typeof value === 'string') {
    const normalized = Number.parseFloat(value.replaceAll(',', ''))
    if (Number.isFinite(normalized)) {
      return normalized.toLocaleString(undefined, { maximumFractionDigits: 2 })
    }
    return value
  }
  return '-'
}

const parseHistoryNumericValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const normalized = Number.parseFloat(value.replaceAll(',', ''))
    if (Number.isFinite(normalized)) return normalized
  }
  return null
}

const formatHistoryUsdValue = (tokenAmount, zamaUsd) => {
  const normalizedTokenAmount = parseHistoryNumericValue(tokenAmount)
  if (normalizedTokenAmount === null) return null
  if (!Number.isFinite(zamaUsd) || zamaUsd <= 0) return null
  const usdValue = normalizedTokenAmount * zamaUsd
  return usdValue.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

const resolveHistoryStatus = (row, nowTimestamp) => {
  const unlockEndTimestamp = Date.parse(row.unlockEndAt)
  const claimTimestamp = Date.parse(row.claimAt)

  if (!Number.isFinite(unlockEndTimestamp)) {
    if (row.rewardStatus === 'claimed') {
      return { label: 'claimed', className: 'history-status-completed' }
    }
    if (row.rewardStatus === 'pending_reward') {
      return { label: 'pending reward', className: 'history-status-pending' }
    }
    return { label: 'unlocking', className: 'history-status-unlocking' }
  }

  if (nowTimestamp < unlockEndTimestamp) {
    return { label: 'unlocking', className: 'history-status-unlocking' }
  }

  if (Number.isFinite(claimTimestamp) && nowTimestamp < claimTimestamp) {
    return { label: 'pending reward', className: 'history-status-pending' }
  }

  return { label: 'claimed', className: 'history-status-completed' }
}

function Home() {
  const partnersCarouselRef = useRef(null)
  const [walletAddress, setWalletAddress] = useState('')
  const [action, setAction] = useState('buy')
  const [trxAmount, setTrxAmount] = useState(1)
  const [mintAmount, setMintAmount] = useState(100000)
  const [marketPrices, setMarketPrices] = useState({ ethUsd: 0, zamaUsd: 0 })
  const [marketPricesLoading, setMarketPricesLoading] = useState(true)
  const [sortConfig, setSortConfig] = useState({ key: 'apr', direction: 'desc' })
  const [operators, setOperators] = useState([])
  const [operatorsLoading, setOperatorsLoading] = useState(true)
  const [operatorsError, setOperatorsError] = useState('')
  const [communityHistory, setCommunityHistory] = useState([])
  const [communityHistoryLoading, setCommunityHistoryLoading] = useState(true)
  const [communityHistoryError, setCommunityHistoryError] = useState('')
  const [nowTimestamp, setNowTimestamp] = useState(Date.now())
  const [expandedStakeKey, setExpandedStakeKey] = useState(null)
  const [stakePanelTab, setStakePanelTab] = useState('stake')
  const [stakeInputValues, setStakeInputValues] = useState({})
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false)
  const [supportForm, setSupportForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [supportStatus, setSupportStatus] = useState('')
  const [supportSubmitting, setSupportSubmitting] = useState(false)

  useEffect(() => {
    return setupTemCashPartnersCarousel(partnersCarouselRef.current)
  }, [])

  useEffect(() => {
    const htmlEl = document.documentElement
    const bodyEl = document.body
    const previousHtmlOverflow = htmlEl.style.overflow
    const previousBodyOverflow = bodyEl.style.overflow
    const isMobileViewport = window.matchMedia('(max-width: 639px)').matches

    if (isChatPanelOpen && isMobileViewport) {
      htmlEl.style.overflow = 'hidden'
      bodyEl.style.overflow = 'hidden'
    }

    return () => {
      htmlEl.style.overflow = previousHtmlOverflow
      bodyEl.style.overflow = previousBodyOverflow
    }
  }, [isChatPanelOpen])

  useEffect(() => {
    let ignore = false

    const loadMarketPrices = async () => {
      try {
        const response = await fetch(COINGECKO_SIMPLE_PRICE_URL)
        if (!response.ok) {
          throw new Error(`CoinGecko request failed with status ${response.status}`)
        }

        const payload = await response.json()
        const ethUsd = Number(payload?.ethereum?.usd)
        const zamaUsd = Number(payload?.zama?.usd)
        if (!Number.isFinite(ethUsd) || !Number.isFinite(zamaUsd) || ethUsd <= 0 || zamaUsd <= 0) {
          throw new Error('CoinGecko returned invalid market prices.')
        }

        if (ignore) return
        setMarketPrices({ ethUsd, zamaUsd })
      } catch {
        if (ignore) return
      } finally {
        if (!ignore) {
          setMarketPricesLoading(false)
        }
      }
    }

    loadMarketPrices()
    const intervalId = window.setInterval(loadMarketPrices, 60000)

    return () => {
      ignore = true
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    let ignore = false

    const loadCommunityHistory = async () => {
      if (ignore) return
      setCommunityHistoryLoading(true)
      setCommunityHistoryError('')

      try {
        const response = await fetch(`${API_BASE_URL}/api/community-staking-history`)

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`)
        }

        const payload = await response.json()
        if (!Array.isArray(payload?.data)) {
          throw new Error('Invalid API response shape.')
        }

        if (ignore) return
        setCommunityHistory(payload.data)
      } catch {
        if (ignore) return

        setCommunityHistoryError('Unable to sync community staking history from backend.')
        setCommunityHistory([])
      } finally {
        if (!ignore) {
          setCommunityHistoryLoading(false)
        }
      }
    }

    loadCommunityHistory()
    const intervalId = window.setInterval(loadCommunityHistory, 30000)

    return () => {
      ignore = true
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTimestamp(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    const loadOperators = async () => {
      setOperatorsLoading(true)
      setOperatorsError('')

      try {
        const response = await fetch(`${API_BASE_URL}/api/staking-operators`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`)
        }

        const payload = await response.json()
        if (!Array.isArray(payload?.data)) {
          throw new Error('Invalid API response shape.')
        }

        setOperators(payload.data)
      } catch (error) {
        if (error?.name === 'AbortError') return

        setOperatorsError('Unable to sync staking operators from backend.')
        setOperators([])
      } finally {
        setOperatorsLoading(false)
      }
    }

    loadOperators()
    return () => controller.abort()
  }, [])

  const zamaPerEth = useMemo(() => {
    if (marketPrices.ethUsd <= 0 || marketPrices.zamaUsd <= 0) return 0
    return marketPrices.ethUsd / marketPrices.zamaUsd
  }, [marketPrices.ethUsd, marketPrices.zamaUsd])
  const ethPerZama = useMemo(() => {
    if (marketPrices.ethUsd <= 0 || marketPrices.zamaUsd <= 0) return 0
    return marketPrices.zamaUsd / marketPrices.ethUsd
  }, [marketPrices.ethUsd, marketPrices.zamaUsd])
  const temReceived = useMemo(() => trxAmount * zamaPerEth, [trxAmount, zamaPerEth])
  const trxLabel = useMemo(() => Number(trxAmount).toLocaleString(), [trxAmount])
  const ethReceivedForMint = useMemo(() => mintAmount * ethPerZama, [mintAmount, ethPerZama])
  const sortedOperators = useMemo(() => {
    const rows = [...operators]
    if (!sortConfig?.key) return rows

    rows.sort((a, b) => {
      const aValue = parseSortValue(a[sortConfig.key])
      const bValue = parseSortValue(b[sortConfig.key])

      const aMissing = aValue === null || aValue === undefined
      const bMissing = bValue === null || bValue === undefined
      if (aMissing && bMissing) return 0
      if (aMissing) return 1
      if (bMissing) return -1

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      const compare = String(aValue).localeCompare(String(bValue))
      return sortConfig.direction === 'asc' ? compare : -compare
    })

    return rows
  }, [sortConfig, operators])

  const handleTrxChange = (event) => {
    const value = Number(event.target.value)
    setTrxAmount(Number.isFinite(value) && value >= 0 ? value : 0)
  }

  const handleMintChange = (event) => {
    const value = Number(event.target.value)
    setMintAmount(Number.isFinite(value) && value >= 0 ? value : 0)
  }

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'desc' }
    })
  }

  const isWalletConnected = Boolean(walletAddress)

  const handleConnectWallet = () => {
  }

  const handleStakeToggle = (operatorKey) => {
    if (!isWalletConnected) return
    setExpandedStakeKey((prev) => (prev === operatorKey ? null : operatorKey))
    setStakePanelTab('stake')
  }

  const handleWalletSessionChange = (session) => {
    const nextAddress = session?.isConnected ? session?.walletData?.address ?? '' : ''
    setWalletAddress(nextAddress)
    if (!nextAddress) {
      setExpandedStakeKey(null)
    }
  }

  const handleStakeAmountChange = (operatorKey, value) => {
    setStakeInputValues((prev) => ({ ...prev, [operatorKey]: value }))
  }

  const handleStakePercentageClick = (operatorKey, percentLabel) => {
    const nextValue = percentLabel === 'MAX' ? '0' : '0'
    setStakeInputValues((prev) => ({ ...prev, [operatorKey]: nextValue }))
  }

  const handleSupportFieldChange = (event) => {
    const { name, value } = event.target
    setSupportForm((prev) => ({ ...prev, [name]: value }))
    if (supportStatus) setSupportStatus('')
  }

  const handleSupportSubmit = async (event) => {
    event.preventDefault()
    const trimmedValues = {
      name: supportForm.name.trim(),
      email: supportForm.email.trim(),
      subject: supportForm.subject.trim(),
      message: supportForm.message.trim(),
    }

    if (!trimmedValues.name || !trimmedValues.email || !trimmedValues.subject || !trimmedValues.message) {
      setSupportStatus('Please fill in all fields before sending your support request.')
      return
    }

    setSupportSubmitting(true)
    setSupportStatus('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/support/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trimmedValues),
      })
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Failed to send support request.'))
      }
      setSupportForm({
        name: '',
        email: '',
        subject: '',
        message: '',
      })
      setSupportStatus('Support request sent successfully. Our team will review it shortly.')
    } catch (error) {
      setSupportStatus(error instanceof Error ? error.message : 'Failed to send support request.')
    } finally {
      setSupportSubmitting(false)
    }
  }

  return (
    <div
      className={`home-page flex min-h-screen flex-col overflow-x-hidden bg-black text-white ${isChatPanelOpen ? 'home-chat-open' : ''}`}
    >
      <div
        className={`transition-[margin] duration-300 ease-out ${isChatPanelOpen ? 'sm:mr-[380px]' : ''}`}
      >
      <div
        className="bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
      <header className="tem-cash-header">
        <div className="navbar-fixed">
          <nav className="grey darken-4 nav-wrapper">
            <div className="tem-cash-nav-inner">
              <a href="/" className="flex min-w-0 shrink items-center gap-1">
                <img src={logoGif} alt="TEM logo" className="h-12 w-12 shrink-0 rounded-full object-cover sm:h-[64px] sm:w-[64px]" />
                <img src={tLogo} alt="TEM text logo" className="-ml-1 h-10 w-auto max-w-[min(140px,42vw)] object-contain sm:-ml-2 sm:h-14 sm:max-w-none" />
              </a>
              <div className="tem-cash-topbar-actions">
                <div className="topbar-button valign-wrapper">
                </div>
              </div>
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-16 lg:px-8 lg:py-16">
        <section className={`grid gap-6 ${isChatPanelOpen ? 'min-[1500px]:lg:grid-cols-[2.2fr_1fr]' : 'lg:grid-cols-[2.2fr_1fr]'}`}>
          <article className="rounded-2xl border border-lime-300/20 bg-black p-4 shadow-2xl sm:rounded-3xl sm:p-6 md:p-8">
            <div className={`grid gap-6 md:gap-8 ${isChatPanelOpen ? 'min-[1500px]:lg:grid-cols-[minmax(0,360px)_1fr]' : 'lg:grid-cols-[minmax(0,360px)_1fr]'}`}>
              <div className="flex h-full w-full items-center justify-center">
                <div
                  className={`aspect-square w-full min-h-[220px] ${
                    isChatPanelOpen
                      ? 'max-w-[240px] min-[1200px]:max-w-[280px] min-[1550px]:max-w-[360px] max-h-[min(360px,70vw)]'
                      : 'max-w-[360px] max-h-[min(360px,70vw)]'
                  }`}
                >
                  <Spline scene="https://prod.spline.design/JIZmxcV4oYUWBm21/scene.splinecode" />
                </div>
              </div>

              <div className="min-w-0 space-y-2 sm:space-y-3">
                <h1 className="text-2xl font-bold text-lime-100 sm:text-3xl">Zama Staking</h1>
                <p className="text-base text-lime-100/90 sm:text-lg">Secure staking. Simple rewards.</p>
                <p className="text-md leading-5 sm:leading-6 text-zinc-200">
                  Stake ZAMA with a listed operator and earn rewards based on the APR shown in the staking table. Each operator displays its reward rate, total stake, rewards, and commission so you can compare before staking.
                </p>
                <p className="text-md leading-5 sm:leading-6 text-zinc-300">
                  Choose an operator, enter your ZAMA amount, and start earning. Your rewards depend on the operator you select, the amount you stake, and how long your tokens remain staked.
                </p>
                <button
                  type="button"
                  className="!mt-4 mx-auto block rounded-full bg-zinc-700 px-8 py-3 text-sm font-bold tracking-wide text-zinc-100 transition hover:bg-zinc-600"
                >
                  WHITEPAPER V2
                </button>
              </div>
            </div>
          </article>

          <aside className="min-w-0 space-y-4">
            <div className="rounded-2xl border border-lime-300/30 bg-black p-4 shadow-xl sm:rounded-[30px] sm:p-6">
              <label htmlFor="temAction" className="text-[12px] text-zinc-300">
                ZAMA action:
              </label>
              <select
                id="temAction"
                value={action}
                onChange={(event) => setAction(event.target.value)}
                className="mb-5 mt-1 w-full border-b border-zinc-500 bg-transparent pb-2 text-[18px] leading-none text-white outline-none"
              >
                <option value="buy" className="text-black">
                  buy
                </option>
                <option value="mint" className="text-black">
                  mint
                </option>
              </select>

              {action === 'buy' ? (
                <>
                  <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                    <div>
                      <label htmlFor="trxInput" className="block text-[12px] text-zinc-400">
                        ETH (pay):
                      </label>
                      <input
                        id="trxInput"
                        type="number"
                        value={trxAmount}
                        onChange={handleTrxChange}
                        className="mt-1 w-full border-b border-zinc-500 bg-transparent pb-2 text-[18px] text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] text-zinc-400">ZAMA (get):</label>
                      <div className="mt-1 w-full border-b border-dotted border-zinc-500 pb-2 text-[18px] text-zinc-400">
                        {temReceived.toFixed(6)}
                      </div>
                    </div>
                  </div>
                  <p className="mb-5 text-right text-[11px] font-semibold text-white">
                    {marketPricesLoading ? 'Loading market prices...' : `1 ETH ≈ ${zamaPerEth.toLocaleString(undefined, { maximumFractionDigits: 2 })} ZAMA`}
                  </p>
                  <button
                    type="button"
                    className="w-full rounded-full border-[3px] border-lime-400 bg-transparent py-3 text-[18px] font-extrabold leading-none text-lime-300 transition hover:bg-lime-400/10"
                  >
                    {trxLabel} ETH
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-7">
                    <label htmlFor="mintInput" className="block text-[12px] text-zinc-400">
                      Mint ZAMA Amount:
                    </label>
                    <input
                      id="mintInput"
                      type="number"
                      value={mintAmount}
                      onChange={handleMintChange}
                      className="mt-1 w-full border-b border-zinc-500 bg-transparent pb-2 text-[18px] text-white outline-none"
                    />
                  </div>
                  <p className="mb-5 text-right text-[11px] font-semibold text-white">
                    {marketPricesLoading ? 'Loading market prices...' : `1 ZAMA ≈ ${ethPerZama.toFixed(8)} ETH`}
                  </p>
                  <button
                    type="button"
                    className="w-full rounded-full border-[3px] border-lime-400 bg-transparent py-3 text-[18px] font-extrabold leading-none text-lime-300 transition hover:bg-lime-400/10"
                  >
                    {ethReceivedForMint.toLocaleString(undefined, { maximumFractionDigits: 8 })} ETH
                  </button>
                </>
              )}
            </div>
          </aside>
        </section>
      </main>
      </div>

      <section className="zama-staking-section bg-black/95">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="community-history-wrap">
            <div className="community-history-header">
              <h5>Other Users&apos; Staking History</h5>
              <p>
                {communityHistoryLoading
                  ? 'Loading community staking history...'
                  : communityHistoryError || `${communityHistory.length} records`}
              </p>
            </div>
            <div className="community-history-table-wrap">
              <table className="community-history-table">
                <thead>
                  <tr>
                    <th>Wallet</th>
                    <th className="hidden sm:table-cell">Operator</th>
                    <th>Amount</th>
                    <th>Reward</th>
                    <th className="hidden sm:table-cell">Unlock / Status</th>
                  </tr>
                </thead>
                <tbody>
                  {communityHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="history-empty-row">
                        No community staking history available.
                      </td>
                    </tr>
                  ) : (
                    communityHistory.map((row) => {
                      const remaining = formatRemainingDuration(row.unlockEndAt, nowTimestamp)
                      const status = resolveHistoryStatus(row, nowTimestamp)
                      const operatorIcon = getOperatorIconUrl(row.operator)
                      const walletLabel = row.wallet ?? '-'
                      const operatorLabel = row.operator ?? '-'
                      const amountUsdLabel = formatHistoryUsdValue(row.amount, marketPrices.zamaUsd)
                      const rewardsUsdLabel = formatHistoryUsdValue(row.rewards, marketPrices.zamaUsd)
                      return (
                        <tr key={`${row.wallet}-${row.operator}-${row.unlockEndAt ?? row.unlockTime}`}>
                          <td>
                            <span className="history-wallet-pill">{formatHistoryWallet(walletLabel)}</span>
                          </td>
                          <td className="hidden sm:table-cell">
                            <div className="history-operator-cell">
                              {operatorIcon ? (
                                <span className="history-operator-dot">
                                  <img src={operatorIcon} alt={`${operatorLabel} icon`} loading="lazy" />
                                </span>
                              ) : null}
                              <span>{operatorLabel}</span>
                            </div>
                          </td>
                          <td>
                            <span className="history-token-stack">
                              <span className="history-token-value">{formatHistoryNumber(row.amount)} $ZAMA</span>
                              <span className="history-token-usd">≈ {amountUsdLabel ?? '--'}</span>
                            </span>
                          </td>
                          <td>
                            <span className="history-token-stack">
                              <span className="history-token-value">{formatHistoryNumber(row.rewards)} $ZAMA</span>
                              <span className="history-token-usd">≈ {rewardsUsdLabel ?? '--'}</span>
                            </span>
                          </td>
                          <td className="hidden sm:table-cell">
                            {status.label === 'unlocking' ? (
                              <span className="history-countdown-pill">{remaining === '-' ? 'Finishing soon' : remaining}</span>
                            ) : (
                              <span className={`history-status-badge ${status.className}`}>{status.label}</span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-2xl font-bold text-lime-100 sm:text-3xl">Zama staking operators</h4>
              <p className="mt-2 text-zinc-300">
                {operatorsLoading
                  ? 'Loading operators from backend...'
                  : operatorsError || `${operators.length} operators synced from backend.`}
              </p>
            </div>
          </div>

          <div className="zama-staking-table-wrap">
            <table className="zama-staking-table">
              <thead>
                <tr>
                  {SORTABLE_COLUMNS.map((column) => (
                    <th key={column.key}>
                      <button
                        type="button"
                        className="sort-header-btn"
                        onClick={() => handleSort(column.key)}
                        aria-label={`Sort by ${column.label}`}
                      >
                        <span>{column.label}</span>
                        <span className={`sort-indicator ${sortConfig.key === column.key ? 'is-active' : ''}`} aria-hidden="true">
                          {sortConfig.key === column.key && sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      </button>
                    </th>
                  ))}
                  <th>Your Stake</th>
                  <th>Your Rewards</th>
                  <th aria-label="Action column" />
                </tr>
              </thead>
              <tbody>
                {sortedOperators.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-zinc-400">
                      No staking operators available.
                    </td>
                  </tr>
                ) : (
                  sortedOperators.map((item) => {
                    const operatorKey = `${item.operator}-${item.role}`
                    const isExpanded = isWalletConnected && expandedStakeKey === operatorKey

                    return (
                      <Fragment key={operatorKey}>
                        <tr>
                          <td>
                            <span className="operator-cell">
                              <span className="operator-dot" aria-hidden="true">
                                {getOperatorIconUrl(item.operator) ? (
                                  <img
                                    src={getOperatorIconUrl(item.operator)}
                                    alt=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                    onError={(event) => {
                                      const fallback = event.currentTarget.nextElementSibling
                                      event.currentTarget.style.display = 'none'
                                      if (fallback) fallback.style.display = 'inline'
                                    }}
                                  />
                                ) : null}
                                <span className="operator-dot-fallback">{item.operator[0]}</span>
                              </span>
                              <span>{item.operator}</span>
                            </span>
                          </td>
                          <td>{item.role}</td>
                          <td>{item.apr}</td>
                          <td>{item.totalRewards}</td>
                          <td>{item.totalStake}</td>
                          <td>{item.commission}</td>
                          <td>-</td>
                          <td>-</td>
                          <td className="zama-staking-table-button">
                            <button
                              type="button"
                              className="connect-btn"
                              onClick={isWalletConnected ? () => handleStakeToggle(operatorKey) : handleConnectWallet}
                            >
                              {isWalletConnected ? `Stake ${isExpanded ? '▴' : '▾'}` : 'CONNECT WALLET'}
                            </button>
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr className="stake-panel-row">
                            <td colSpan={9}>
                              <div className="stake-panel">
                                <div className="stake-panel-tabs">
                                  <button
                                    type="button"
                                    className={`stake-panel-tab ${stakePanelTab === 'stake' ? 'is-active' : ''}`}
                                    onClick={() => setStakePanelTab('stake')}
                                  >
                                    Stake
                                  </button>
                                  <button
                                    type="button"
                                    className={`stake-panel-tab ${stakePanelTab === 'claim' ? 'is-active' : ''}`}
                                    onClick={() => setStakePanelTab('claim')}
                                  >
                                    Claim Rewards
                                  </button>
                                </div>

                                {stakePanelTab === 'stake' ? (
                                  <div className="stake-panel-content">
                                    <label className="stake-panel-label" htmlFor={`stake-input-${operatorKey}`}>
                                      ZAMA Amount
                                    </label>
                                    <div className="stake-panel-input-row">
                                      <input
                                        id={`stake-input-${operatorKey}`}
                                        type="number"
                                        min="0"
                                        step="any"
                                        className="stake-panel-input"
                                        placeholder="0.00"
                                        value={stakeInputValues[operatorKey] ?? ''}
                                        onChange={(event) => handleStakeAmountChange(operatorKey, event.target.value)}
                                      />
                                      <div className="stake-panel-action-col">
                                        <button type="button" className="stake-panel-approve-btn" disabled>
                                          Approve &amp; Stake
                                        </button>
                                        <div className="stake-panel-percent-row">
                                          {['25%', '50%', '75%', 'MAX'].map((percentLabel) => (
                                            <button
                                              key={percentLabel}
                                              type="button"
                                              className="stake-panel-percent-btn"
                                              onClick={() => handleStakePercentageClick(operatorKey, percentLabel)}
                                            >
                                              {percentLabel}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    <p className="stake-panel-balance">Balance: 0.00 $ZAMA</p>
                                    <p className="stake-panel-note">When you unstake, token withdrawals are only available after the unbonding period of 1 week.</p>
                                  </div>
                                ) : (
                                  <p className="stake-panel-placeholder">Stake to start earning rewards.</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="border-b border-lime-300/20 bg-black/90">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.7fr_1fr] lg:gap-24">
            <div className="min-w-0">
              <h5 className="text-2xl font-bold text-lime-100 sm:text-3xl">A simpler way to stake with Zama</h5>
              <p className="mt-3 leading-6 sm:leading-7 text-zinc-200">
                Zama Staking is designed to make reward earning clear before users commit their tokens. Instead of a single fixed rate, rewards are based on the APR offered by each staking operator.
              </p>
              <p className="mt-3 leading-6 sm:leading-7 text-zinc-300">
                The final reward amount depends on the selected operator’s APR, the user’s staked ZAMA amount, staking duration, and any operator commission. Higher APR may offer higher estimated rewards, while commission can reduce the final amount received.
              </p>
              <p className="mt-3 leading-6 sm:leading-7 text-zinc-300">
                Users can review APR, total rewards, total stake, and commission directly in the staking table, then manage staking, reward tracking, and claiming from one simple interface.
              </p>
              <p className="mt-4 text-zinc-200">Explore Zama Staking through the links below:</p>
              <div className="mt-2 flex flex-col text-sm">
                <a href="/blog/how-to-stake-zama" className="text-violet-300 hover:text-violet-200" target='_blank'>
                  How to Stake ZAMA
                </a>
                <a href="/blog/how-to-stake-zama" className="text-violet-300 hover:text-violet-200" target='_blank'>
                  Staking Overview
                </a>
                <a href="/blog/how-to-stake-zama" className="text-violet-300 hover:text-violet-200" target='_blank'>
                  What is Zama Staking
                </a>
              </div>
            </div>

            <div className="min-w-0">
              <h5 className="text-2xl font-bold text-lime-100 sm:text-3xl">Email Support</h5>
              <form className="support-form-card mt-4" onSubmit={handleSupportSubmit}>
                <div className="support-form-row">
                  <label htmlFor="support-name">Full name</label>
                  <input
                    id="support-name"
                    name="name"
                    type="text"
                    value={supportForm.name}
                    onChange={handleSupportFieldChange}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </div>
                <div className="support-form-row">
                  <label htmlFor="support-email">Email address</label>
                  <input
                    id="support-email"
                    name="email"
                    type="email"
                    value={supportForm.email}
                    onChange={handleSupportFieldChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
                <div className="support-form-row">
                  <label htmlFor="support-subject">Subject</label>
                  <input
                    id="support-subject"
                    name="subject"
                    type="text"
                    value={supportForm.subject}
                    onChange={handleSupportFieldChange}
                    placeholder="How can we help?"
                  />
                </div>
                <div className="support-form-row">
                  <label htmlFor="support-message">Message</label>
                  <textarea
                    id="support-message"
                    name="message"
                    value={supportForm.message}
                    onChange={handleSupportFieldChange}
                    placeholder="Describe your issue or question..."
                    rows={4}
                  />
                </div>
                <button type="submit" className="support-form-submit" disabled={supportSubmitting}>
                  {supportSubmitting ? 'Sending...' : 'Send Support Email'}
                </button>
                {supportStatus ? <p className="support-form-status">{supportStatus}</p> : null}
              </form>
            </div>
          </div>

          <div className="tem-trusted-partners mt-10">
            <div className="col s12">
              <h5 className="white-text">Trusted partners</h5>
              <div ref={partnersCarouselRef} className="carousel">
                {TRUSTED_PARTNER_SLIDES.map((p, i) => (
                  <a
                    key={`${p.href}-${p.img}-${i}`}
                    className="carousel-item"
                    href={p.href}
                    target="_blank"
                    rel="external nofollow noindex noopener"
                  >
                    <img src={A(p.img)} alt="" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-800 py-4">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 lg:px-8">
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-300">
              <li><a href="#" className="hover:text-lime-300">Twitter</a></li>
              <li><a href="#" className="hover:text-lime-300">Blog</a></li>
              <li><a href="#" className="hover:text-lime-300">Terms &amp; conditions</a></li>
            </ul>
            <p className="text-sm text-zinc-500">© 2026 ZAMA</p>
          </div>
        </div>
      </footer>
      </div>

      <button
        type="button"
        onClick={() => setIsChatPanelOpen((prev) => !prev)}
        className={`fixed right-0 top-1/2 z-[95] -translate-y-1/2 rounded-l-xl border border-r-0 border-lime-300/30 bg-zinc-900 px-3 py-4 text-lime-200 shadow-xl transition-all duration-300 ease-out hover:bg-zinc-800 ${
          isChatPanelOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
        aria-label={isChatPanelOpen ? 'Close group chat panel' : 'Open group chat panel'}
        title={isChatPanelOpen ? 'Close group chat' : 'Open group chat'}
      >
        <span className="block text-xs font-semibold tracking-wide">CHAT</span>
      </button>

      <aside
        className={`fixed right-0 top-0 z-[100] h-[100dvh] w-screen sm:w-[380px] sm:max-w-[380px] border-l border-lime-300/20 bg-zinc-950 shadow-2xl transition-transform duration-300 ease-out ${
          isChatPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!isChatPanelOpen}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-200">Group Chat</h4>
            <button
              type="button"
              onClick={() => setIsChatPanelOpen(false)}
              className="rounded-md border border-white/20 px-2 py-1 text-xs text-zinc-300 transition hover:border-lime-300/40 hover:text-lime-200"
              aria-label="Close group chat"
            >
              Close
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col px-2 pb-2">
            <GroupChat isSidePanel />
          </div>
        </div>
      </aside>
    </div>
  )
}

export default Home
