import M from 'materialize-css'

/** Same behavior as tem.cash `CarouselAutoplay` (dist/padding/autoScroll + pause on hover). */
export function setupTemCashPartnersCarousel(carouselEl) {
  if (!carouselEl) return () => {}

  const existing = M.Carousel.getInstance(carouselEl)
  if (existing) existing.destroy()

  const raw = M.Carousel.init(carouselEl, {
    dist: 0,
    padding: 100,
    autoScroll: 3500,
  })
  const instance = Array.isArray(raw) ? raw[0] : raw
  if (!instance) return () => {}

  const pause = () => {
    const c = M.Carousel.getInstance(carouselEl)
    if (c?.autoScrollIntervalId) {
      window.clearInterval(c.autoScrollIntervalId)
      c.autoScrollIntervalId = undefined
    }
  }

  const resume = () => {
    const c = M.Carousel.getInstance(carouselEl)
    if (c && !c.autoScrollIntervalId && c.options.autoScroll) {
      c.autoScrollIntervalId = window.setInterval(() => c.next(), c.options.autoScroll)
    }
  }

  if (instance.options.autoScroll) {
    instance.autoScrollIntervalId = window.setInterval(() => instance.next(), instance.options.autoScroll)
  }

  carouselEl.addEventListener('mouseover', pause, { passive: true })
  carouselEl.addEventListener('mouseleave', resume, { passive: true })
  carouselEl.addEventListener('touchstart', pause, { passive: true })
  carouselEl.addEventListener('touchend', resume, { passive: true })

  return () => {
    pause()
    carouselEl.removeEventListener('mouseover', pause)
    carouselEl.removeEventListener('mouseleave', resume)
    carouselEl.removeEventListener('touchstart', pause)
    carouselEl.removeEventListener('touchend', resume)
    instance.destroy()
  }
}
