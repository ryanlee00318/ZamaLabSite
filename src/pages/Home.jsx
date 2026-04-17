import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import Spline from '@splinetool/react-spline'
import backgroundImage from '../assets/background.png'
import logoGif from '../assets/logo.gif'
import tLogo from '../assets/t-logo.png'
import { setupTemCashPartnersCarousel } from '../lib/temCashPartnersCarousel'
import { setupTemCashWalletFlip } from '../lib/temCashImageFlip'
import walletFlipUrls from '../lib/temCashWalletFlipManifest.json'
import '../styles/temTrustedPartners.css'
import '../styles/temCashHeader.css'

const REWARD_RATE = 0.9750186519
const MINT_RATE = 1.553813
const STATIC_WALLET_ADDRESS = '0x88f9DADF3541998B7edB482485C56234297C84c4'
const A = (name) => `/tem-cash-assets/${name}`

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

const ZAMA_STAKING_OPERATORS = [
  { operator: 'Conduit', role: 'KMS', apr: '47.11%', totalRewards: '5.2M', totalStake: '47.1M', commission: '10.00%' },
  { operator: 'InfStones', role: 'KMS', apr: '46.92%', totalRewards: '5.2M', totalStake: '47.5M', commission: '10.00%' },
  { operator: 'Artifact', role: 'Coprocessor', apr: '46.85%', totalRewards: '8.6M', totalStake: '83.0M', commission: '10.00%' },
  { operator: 'Blockscape', role: 'Coprocessor', apr: '46.79%', totalRewards: '8.7M', totalStake: '83.2M', commission: '10.00%' },
  { operator: 'Luganodes', role: 'Coprocessor', apr: '46.11%', totalRewards: '8.4M', totalStake: '85.7M', commission: '10.00%' },
  { operator: 'P2P', role: 'Coprocessor', apr: '45.88%', totalRewards: '9.3M', totalStake: '86.5M', commission: '10.00%' },
  { operator: 'Unit410', role: 'KMS', apr: '45.60%', totalRewards: '4.2M', totalStake: '39.7M', commission: '20.00%' },
  { operator: 'Figment', role: 'KMS', apr: '44.74%', totalRewards: '4.1M', totalStake: '41.3M', commission: '20.00%' },
  { operator: 'Zama (Coprocessor)', role: 'Coprocessor', apr: '44.63%', totalRewards: '9.2M', totalStake: '91.4M', commission: '10.00%' },
  { operator: 'Omakase', role: 'KMS', apr: '44.62%', totalRewards: '4.2M', totalStake: '41.5M', commission: '20.00%' },
  { operator: 'Etherscan', role: 'KMS', apr: '44.31%', totalRewards: '5.3M', totalStake: '53.3M', commission: '10.00%' },
  { operator: 'Ledger', role: 'KMS', apr: '43.90%', totalRewards: '4.4M', totalStake: '42.9M', commission: '20.00%' },
  { operator: 'LayerZero', role: 'KMS', apr: '43.20%', totalRewards: '5.3M', totalStake: '56.0M', commission: '10.00%' },
  { operator: 'Stake Capital', role: 'KMS', apr: '42.74%', totalRewards: '5.3M', totalStake: '57.3M', commission: '10.00%' },
  { operator: 'Dfns', role: 'KMS', apr: '42.65%', totalRewards: '5.2M', totalStake: '57.5M', commission: '10.00%' },
  { operator: 'Fireblocks', role: 'KMS', apr: '42.29%', totalRewards: '5.3M', totalStake: '58.5M', commission: '10.00%' },
  { operator: 'OpenZeppelin', role: 'KMS', apr: '42.24%', totalRewards: '5.1M', totalStake: '46.3M', commission: '20.00%' },
  { operator: 'Zama (KMS)', role: 'KMS', apr: '40.85%', totalRewards: '5.4M', totalStake: '62.7M', commission: '10.00%' },
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

function Home() {
  const partnersCarouselRef = useRef(null)
  const walletsFlipRef = useRef(null)
  const [walletAddress, setWalletAddress] = useState(null)
  const [action, setAction] = useState('buy')
  const [trxAmount, setTrxAmount] = useState(10000)
  const [mintAmount, setMintAmount] = useState(10000)
  const [sortConfig, setSortConfig] = useState({ key: 'apr', direction: 'desc' })
  const [expandedStakeKey, setExpandedStakeKey] = useState(null)
  const [stakePanelTab, setStakePanelTab] = useState('stake')
  const [stakeInputValues, setStakeInputValues] = useState({})
  const [supportForm, setSupportForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [supportStatus, setSupportStatus] = useState('')

  useEffect(() => {
    return setupTemCashPartnersCarousel(partnersCarouselRef.current)
  }, [])

  useEffect(() => {
    return setupTemCashWalletFlip(walletsFlipRef.current, walletFlipUrls)
  }, [])

  const temReceived = useMemo(() => trxAmount * REWARD_RATE, [trxAmount])
  const trxLabel = useMemo(() => Number(trxAmount).toLocaleString(), [trxAmount])
  const trxNeededForMint = useMemo(() => mintAmount * MINT_RATE, [mintAmount])
  const sortedOperators = useMemo(() => {
    const rows = [...ZAMA_STAKING_OPERATORS]
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
  }, [sortConfig])

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
    setWalletAddress(STATIC_WALLET_ADDRESS)
  }

  const handleDisconnectWallet = () => {
    setWalletAddress(null)
    setExpandedStakeKey(null)
  }

  const handleStakeToggle = (operatorKey) => {
    if (!isWalletConnected) return
    setExpandedStakeKey((prev) => (prev === operatorKey ? null : operatorKey))
    setStakePanelTab('stake')
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

  const handleSupportSubmit = (event) => {
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

    const subject = encodeURIComponent(`[Support] ${trimmedValues.subject}`)
    const body = encodeURIComponent(
      `Name: ${trimmedValues.name}\nEmail: ${trimmedValues.email}\n\nMessage:\n${trimmedValues.message}`
    )
    window.location.href = `mailto:support@zamalab.site?subject=${subject}&body=${body}`
    setSupportStatus('Your email draft is ready. Please send it from your mail app.')
  }

  return (
    <div className="home-page flex min-h-screen flex-col bg-black text-white">
      <div
        className="bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
      <header className="tem-cash-header">
        <div className="navbar-fixed">
          <nav className="grey darken-4 nav-wrapper">
            <div className="tem-cash-nav-inner">
              <a href="/" className="flex items-center">
                <img src={logoGif} alt="TEM logo" className="h-[64px] w-[64px] rounded-full object-cover" />
                <img src={tLogo} alt="TEM text logo" className="-ml-2 h-14 w-auto object-contain" />
              </a>
              <div className="tem-cash-topbar-actions">
                {isWalletConnected ? (
                  <div className="topbar-button valign-wrapper">
                    <div
                      className="inline-flex max-w-[230px] items-center rounded-sm border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold tracking-wide text-zinc-100"
                      title={walletAddress}
                    >
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap">{walletAddress}</span>
                    </div>
                  </div>
                ) : null}
                <div className="topbar-button valign-wrapper">
                  <button
                    id="wallets-button"
                    type="button"
                    className="btn connect custom-grey waves-black waves-effect white-text"
                    aria-label={isWalletConnected ? 'Disconnect wallet' : 'Connect wallet'}
                    onClick={isWalletConnected ? handleDisconnectWallet : handleConnectWallet}
                    title={isWalletConnected ? walletAddress : 'Connect wallet'}
                  >
                    <div ref={walletsFlipRef} id="wallets-flip" className="image images-flip" />
                  </button>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[70%] px-4 py-20">
        <section className="grid gap-6 lg:grid-cols-[2.2fr_1fr]">
          <article className="rounded-3xl border border-lime-300/20 bg-black p-8 shadow-2xl">
            <div className="grid gap-8 md:grid-cols-[360px_1fr]">
              <div className="flex h-full items-center justify-center">
                <div className="h-[360px] w-[360px]">
                  <Spline scene="https://prod.spline.design/JIZmxcV4oYUWBm21/scene.splinecode" />
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-lime-100">Zama Staking</h1>
                <p className="text-lg text-lime-100/90">Secure staking. Simple rewards.</p>
                <p className="text-md leading-8 text-zinc-200">
                  Participate in Zama Staking through a straightforward staking experience designed for long-term users. Stake your assets, monitor your position, and earn rewards through a clear and accessible interface.
                </p>
                <p className="text-md leading-8 text-zinc-300">
                  Zama Staking is built to make participation simple. Whether you are getting started or managing an existing position, the platform provides an easy way to stake, track performance, and stay engaged with the ecosystem.
                </p>
                <button
                  type="button"
                  className="mt-4 rounded-full bg-zinc-700 px-8 py-3 text-sm font-bold tracking-wide text-zinc-100 transition hover:bg-zinc-600"
                >
                  WHITEPAPER V2
                </button>
              </div>
            </div>
          </article>

          <aside className="space-y-4">
            <div className="rounded-[30px] border border-lime-300/30 bg-black p-6 shadow-xl">
              <label htmlFor="temAction" className="text-[12px] text-zinc-300">
                TEM action:
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
                  <div className="mb-5 grid grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="trxInput" className="block text-[12px] text-zinc-400">
                        TRX (pay):
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
                      <label className="block text-[12px] text-zinc-400">TEM (get):</label>
                      <div className="mt-1 w-full border-b border-dotted border-zinc-500 pb-2 text-[18px] text-zinc-400">
                        {temReceived.toFixed(6)}
                      </div>
                    </div>
                  </div>
                  <p className="mb-5 text-right text-[11px] font-semibold text-white">≈ 1.03 TRX/TEM</p>
                  <button
                    type="button"
                    className="w-full rounded-full border-[3px] border-lime-400 bg-transparent py-3 text-[18px] font-extrabold leading-none text-lime-300 transition hover:bg-lime-400/10"
                  >
                    {trxLabel} TRX
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-7">
                    <label htmlFor="mintInput" className="block text-[12px] text-zinc-400">
                      Mint TEM Amount:
                    </label>
                    <input
                      id="mintInput"
                      type="number"
                      value={mintAmount}
                      onChange={handleMintChange}
                      className="mt-1 w-full border-b border-zinc-500 bg-transparent pb-2 text-[18px] text-white outline-none"
                    />
                  </div>
                  <p className="mb-5 text-right text-[11px] font-semibold text-white">≈ 1.55 TRX/TEM</p>
                  <button
                    type="button"
                    className="w-full rounded-full border-[3px] border-lime-400 bg-transparent py-3 text-[18px] font-extrabold leading-none text-lime-300 transition hover:bg-lime-400/10"
                  >
                    {trxNeededForMint.toLocaleString(undefined, { maximumFractionDigits: 2 })} TRX
                  </button>
                </>
              )}
            </div>
          </aside>
        </section>
      </main>
      </div>

      <section className="zama-staking-section bg-black/95">
        <div className="mx-auto w-full max-w-[70%] px-4 py-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-3xl font-bold text-lime-100">Zama staking operators</h4>
              <p className="mt-2 text-zinc-300">
                Here is the short descprition
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
                {sortedOperators.map((item) => {
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
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="border-b border-lime-300/20 bg-black/90">
        <div className="mx-auto w-full max-w-[70%] px-4 py-10">
          <div className="grid gap-24 lg:grid-cols-[1.7fr_1fr]">
            <div>
              <h5 className="text-3xl font-bold text-lime-100">A simpler way to stake with Zama</h5>
              <p className="mt-3 leading-7 text-zinc-200">
                Zama Staking offers a professional and user-friendly way to participate in staking. The experience is designed to help users manage their assets confidently while maintaining visibility into rewards and staking activity.
              </p>
              <p className="mt-3 leading-7 text-zinc-300">
                With a clean staking flow and accessible interface, users can stake, review balances, and manage positions without unnecessary complexity. The focus is on clarity, consistency, and long-term usability.
              </p>
              <p className="mt-3 leading-7 text-zinc-300">
                Built for reliability and ease of use, Zama Staking supports a more accessible staking experience for users who value simplicity, transparency, and a professional platform experience.
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

            <div>
              <h5 className="text-3xl font-bold text-lime-100">Email Support</h5>
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
                <button type="submit" className="support-form-submit">
                  Send Support Email
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
          <div className="mx-auto flex w-full max-w-[70%] items-center justify-between gap-4 px-4">
            <ul className="flex flex-wrap items-center gap-4 text-sm text-zinc-300">
              <li><a href="#" className="hover:text-lime-300">Twitter</a></li>
              <li><a href="#" className="hover:text-lime-300">Blog</a></li>
              <li><a href="#" className="hover:text-lime-300">Terms &amp; conditions</a></li>
            </ul>
            <p className="text-sm text-zinc-500">© 2026 ZAMA</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
