import { useEffect, useMemo, useRef, useState } from 'react'
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

function Home() {
  const partnersCarouselRef = useRef(null)
  const walletsFlipRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [action, setAction] = useState('buy')
  const [trxAmount, setTrxAmount] = useState(10000)
  const [mintAmount, setMintAmount] = useState(10000)

  useEffect(() => {
    return setupTemCashPartnersCarousel(partnersCarouselRef.current)
  }, [])

  useEffect(() => {
    return setupTemCashWalletFlip(walletsFlipRef.current, walletFlipUrls)
  }, [])

  const temReceived = useMemo(() => trxAmount * REWARD_RATE, [trxAmount])
  const trxLabel = useMemo(() => Number(trxAmount).toLocaleString(), [trxAmount])
  const trxNeededForMint = useMemo(() => mintAmount * MINT_RATE, [mintAmount])

  const handleTrxChange = (event) => {
    const value = Number(event.target.value)
    setTrxAmount(Number.isFinite(value) && value >= 0 ? value : 0)
  }

  const handleMintChange = (event) => {
    const value = Number(event.target.value)
    setMintAmount(Number.isFinite(value) && value >= 0 ? value : 0)
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
                <div className="topbar-button valign-wrapper">
                  <button
                    id="wallets-button"
                    type="button"
                    className="btn connect custom-grey waves-black waves-effect white-text"
                    aria-label="Connect wallet"
                    onClick={() => setMenuOpen(true)}
                  >
                    <div ref={walletsFlipRef} id="wallets-flip" className="image images-flip" />
                  </button>
                </div>
                <div className="topbar-button valign-wrapper">
                  <button
                    id="menu-button"
                    type="button"
                    className="btn custom-lime grey-text text-darken-4 waves-custom-lime waves-effect"
                    aria-label="Open menu"
                    onClick={() => setMenuOpen(true)}
                  >
                    <span className="material-icons tem-cash-menu-icon" aria-hidden="true">
                      menu
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        role="presentation"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
        onClick={() => setMenuOpen(false)}
      >
          <aside
            className={`absolute right-0 top-0 h-full w-[min(100%,320px)] overflow-y-auto bg-[#212121] p-4 shadow-xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
              menuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex justify-between">
              <span className="font-medium">Menu</span>
              <button type="button" className="text-zinc-400" onClick={() => setMenuOpen(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <ul className="space-y-2 text-zinc-200">
              <li>
                <a href="#!" className="flex items-center gap-2 py-2 hover:text-[#cddc39]">
                  <span className="material-icons text-lg">account_balance_wallet</span>
                  Connect wallet
                </a>
              </li>
              <li>
                <a href="#!" className="flex items-center gap-2 py-2 hover:text-[#cddc39]">
                  <span className="material-icons text-lg">payments</span>
                  Recharge TRX
                </a>
              </li>
              <li>
                <a href="#!" className="flex items-center gap-2 py-2 hover:text-[#cddc39]">
                  <span className="material-icons text-lg">token</span>
                  TEM <span className="text-zinc-400">1 TRX</span>
                </a>
              </li>
              <li>
                <a href="#!" className="flex items-center gap-2 py-2 hover:text-[#cddc39]">
                  <span className="material-icons text-lg">swap_horiz</span>
                  Swap TEM TRC10 &gt; TRC20
                </a>
              </li>
              <li>
                <a href="#!" className="flex items-center gap-2 py-2 hover:text-[#cddc39]">
                  <span className="material-icons text-lg">power_settings_new</span>
                  Disconnect
                </a>
              </li>
            </ul>
          </aside>
      </div>

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
                <h1 className="text-3xl font-bold text-lime-100">TEM: Tron Energy Mine</h1>
                <p className="text-lg text-lime-100/90">25.64% APY</p>
                <p className="text-md leading-8 text-zinc-200">
                  Explore TEM, the real alternative to TRON mining. TEM is a unique token with one of the most impressive APYs
                  in the TRON ecosystem. TEM gives a HUGE 90% of generated benefits back to investors every single day and is
                  designed to be the top selection for individuals wanting to maximize their passive income.
                </p>
                <p className="text-md leading-8 text-zinc-300">
                  Moreover, there&apos;s no requirement for TRON staking! Simply mint TEM, and begin receiving TRON rewards. TEM is
                  the only token that represents a simple pathway to generating TRON passive income with minimal effort.
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

      <footer className="border-t border-lime-300/20 bg-black/90">
        <div className="mx-auto w-full max-w-[70%] px-4 py-10">
          <div className="grid gap-24 lg:grid-cols-[1.7fr_1fr]">
            <div>
              <h5 className="text-3xl font-bold text-lime-100">Introducing, the power of TEM!</h5>
              <p className="mt-3 leading-7 text-zinc-200">
                Are you wondering, &quot;Is Tron a good investment?&quot; Dive into the world of TEM and discover the answer. By
                minting TEM tokens, you&apos;re not just investing in Tron; you&apos;re securing your place in one of the best long
                term crypto investments available.
              </p>
              <p className="mt-3 leading-7 text-zinc-300">
                Why join a Tron pool when it&apos;s easier to just mint TEM tokens, and embark on a journey towards excellent daily
                returns with one of the best tron investment sites. With TEM, you&apos;re not just investing - you&apos;re investing
                wisely for your future financial success in the ever-evolving crypto market.
              </p>
              <p className="mt-3 leading-7 text-zinc-300">
                TEM is one of the best low risk investment options in crypto today. In a world full of new crypto meme coins and
                rug pull scams, TEM has a proven track record of delivering excellent returns to investors.
              </p>
              <p className="mt-4 text-zinc-200">You can explore TEM using the links below:</p>
              <div className="mt-2 flex flex-col text-sm">
                <a href="/blog/how-to-mint-zama" className="text-violet-300 hover:text-violet-200" target='_blank'>
                  Mint ZAMA
                </a>
                <a href="/blog/how-to-mint-zama" className="text-violet-300 hover:text-violet-200" target='_blank'>
                  Invest in ZAMA
                </a>
                <a href="/blog/how-to-mint-zama" className="text-violet-300 hover:text-violet-200" target='_blank'>
                  What is ZAMA
                </a>
              </div>
            </div>

            <div>
              <h5 className="text-3xl font-bold text-lime-100">Links</h5>
              <ul className="mt-3 space-y-1 text-zinc-200">
                <li><a href="#" className="hover:text-lime-300">Email support</a></li>
                <li><a href="#" className="hover:text-lime-300">Telegram support</a></li>
                <li><a href="#" className="hover:text-lime-300">Telegram channel</a></li>
                <li><a href="#" className="hover:text-lime-300">Twitter</a></li>
                <li><a href="#" className="hover:text-lime-300">Blog</a></li>
                <li><a href="#" className="hover:text-lime-300">Terms &amp; conditions</a></li>
              </ul>
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
          <p className="mx-auto w-full max-w-[70%] px-4 text-center text-sm text-zinc-500">© 2025 ZAMA</p>
        </div>
      </footer>
    </div>
  )
}

export default Home
