import M from 'materialize-css'

/** Same behavior as tem.cash `CarouselAutoplay` (dist/padding/autoScroll + pause on hover). */
export function setupTemCashPartnersCarousel(carouselEl) {
  if (!carouselEl) return () => {}

  const viewportQuery = window.matchMedia('(max-width: 640px)')
  let instance = null
  let isMobileViewport = viewportQuery.matches

  const destroyInstance = () => {
    if (!instance) return
    if (instance.autoScrollIntervalId) {
      window.clearInterval(instance.autoScrollIntervalId)
      instance.autoScrollIntervalId = undefined
    }
    instance.destroy()
    instance = null
  }

  const initInstance = () => {
    destroyInstance()
    const options = isMobileViewport
      ? {
          dist: 0,
          padding: 0,
          numVisible: 1,
          autoScroll: 3500,
        }
      : {
          dist: 0,
          padding: 100,
          autoScroll: 3500,
        }

    const raw = M.Carousel.init(carouselEl, options)
    instance = Array.isArray(raw) ? raw[0] : raw
    if (!instance) return

    if (instance.options.autoScroll) {
      instance.autoScrollIntervalId = window.setInterval(() => instance?.next(), instance.options.autoScroll)
    }
  }

  const pause = () => {
    if (instance?.autoScrollIntervalId) {
      window.clearInterval(instance.autoScrollIntervalId)
      instance.autoScrollIntervalId = undefined
    }
  }

  const resume = () => {
    if (instance && !instance.autoScrollIntervalId && instance.options.autoScroll) {
      instance.autoScrollIntervalId = window.setInterval(() => instance?.next(), instance.options.autoScroll)
    }
  }

  const handleViewportChange = (event) => {
    const nextIsMobileViewport = event?.matches ?? viewportQuery.matches
    if (nextIsMobileViewport === isMobileViewport) return
    isMobileViewport = nextIsMobileViewport
    initInstance()
  }

  initInstance()
  carouselEl.addEventListener('mouseover', pause, { passive: true })
  carouselEl.addEventListener('mouseleave', resume, { passive: true })
  carouselEl.addEventListener('touchstart', pause, { passive: true })
  carouselEl.addEventListener('touchend', resume, { passive: true })
  if (typeof viewportQuery.addEventListener === 'function') {
    viewportQuery.addEventListener('change', handleViewportChange)
  } else if (typeof viewportQuery.addListener === 'function') {
    viewportQuery.addListener(handleViewportChange)
  }

  return () => {
    pause()
    carouselEl.removeEventListener('mouseover', pause)
    carouselEl.removeEventListener('mouseleave', resume)
    carouselEl.removeEventListener('touchstart', pause)
    carouselEl.removeEventListener('touchend', resume)
    if (typeof viewportQuery.removeEventListener === 'function') {
      viewportQuery.removeEventListener('change', handleViewportChange)
    } else if (typeof viewportQuery.removeListener === 'function') {
      viewportQuery.removeListener(handleViewportChange)
    }
    destroyInstance()
  }
}
