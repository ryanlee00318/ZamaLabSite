/** Same timing and DOM as tem.cash `ImageFlip` (see site bundle module `k9RMj`). */
export const TEM_CASH_WALLET_FLIP_MS = 3000

export function setupTemCashWalletFlip(containerEl, imageUrls) {
  if (!containerEl || !Array.isArray(imageUrls) || !imageUrls.length) return () => {}

  containerEl.innerHTML = ''
  const flipper = document.createElement('div')
  flipper.className = 'flipper'
  for (let r = 0; r < imageUrls.length; r++) {
    const icon = document.createElement('div')
    icon.className = r === 0 ? 'icon show' : 'icon'
    icon.style.backgroundImage = `url('${imageUrls[r]}')`
    flipper.appendChild(icon)
  }
  containerEl.appendChild(flipper)

  let currentIndex = 0
  const showNextIcon = () => {
    const icons = containerEl.querySelectorAll('.icon')
    if (!icons.length) return
    icons[currentIndex].classList.remove('show')
    currentIndex = (currentIndex + 1) % icons.length
    icons[currentIndex].classList.add('show')
  }
  const id = window.setInterval(showNextIcon, TEM_CASH_WALLET_FLIP_MS)
  return () => {
    window.clearInterval(id)
    containerEl.innerHTML = ''
  }
}
