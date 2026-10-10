import { ArrowRight, MapPin, X } from '@phosphor-icons/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../assets'
import { ButtonLink } from './ButtonLink'

type ActivePage = 'home' | 'about' | 'services' | 'solutions' | 'faq' | 'contact'

type SiteHeaderProps = {
  activePage: ActivePage
}

const navItems: Array<{ label: string; page: ActivePage; to: string }> = [
  { label: 'Home', page: 'home', to: '/' },
  { label: 'About', page: 'about', to: '/about' },
  { label: 'Services', page: 'services', to: '/services' },
  { label: 'Solutions', page: 'solutions', to: '/solutions' },
  { label: 'FAQ', page: 'faq', to: '/faq' },
  { label: 'Contact', page: 'contact', to: '/contact' },
]

export function SiteHeader({ activePage }: SiteHeaderProps) {
  const [open, setOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const closeMenu = (restoreFocus = false) => {
    setOpen(false)
    if (restoreFocus) toggleRef.current?.focus()
  }

  useLayoutEffect(() => {
    if (!open || window.matchMedia('(min-width: 64rem)').matches) return
    navRef.current?.removeAttribute('inert')
  }, [open])

  useEffect(() => {
    if (!open || window.matchMedia('(min-width: 64rem)').matches) return
    const focusTimer = window.setTimeout(() => {
      navRef.current?.querySelector<HTMLAnchorElement>('.nav-link')?.focus()
    }, 50)
    return () => window.clearTimeout(focusTimer)
  }, [open])

  useEffect(() => {
    document.body.classList.toggle('menu-open', open)
    const nav = navRef.current
    const desktopMedia = window.matchMedia('(min-width: 64rem)')
    const backgroundRegions = [document.querySelector('main'), document.querySelector('footer')]
    for (const region of backgroundRegions) region?.toggleAttribute('inert', open)
    nav?.toggleAttribute('inert', !desktopMedia.matches && !open)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        closeMenu(true)
        return
      }

      if (event.key !== 'Tab' || !open || window.matchMedia('(min-width: 64rem)').matches) return
      const focusable = Array.from(
        navRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]') ?? [],
      ).filter((element) => element.getAttribute('aria-hidden') !== 'true')
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (open && !navRef.current?.contains(target) && !toggleRef.current?.contains(target)) closeMenu(true)
    }
    const onMediaChange = (event: MediaQueryListEvent) => {
      nav?.toggleAttribute('inert', !event.matches && !open)
      if (event.matches) closeMenu()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    desktopMedia.addEventListener('change', onMediaChange)

    return () => {
      document.body.classList.remove('menu-open')
      nav?.removeAttribute('inert')
      for (const region of backgroundRegions) region?.removeAttribute('inert')
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
      desktopMedia.removeEventListener('change', onMediaChange)
    }
  }, [open])

  return (
    <>
      <div className="utility-bar">
        <div className="site-shell utility-bar__inner">
          <div className="utility-bar__item">
            <MapPin aria-hidden="true" size={14} weight="fill" />
            <span>Serving Businesses Across South Africa</span>
          </div>
        </div>
      </div>
      <header className="site-header">
        <div className="site-shell header-inner">
          <Link className="brand" to="/" aria-label="Gauvis Tech home" onClick={() => closeMenu()}>
            <img src={assets.logo} width="575" height="204" alt="GVT Gauvis Tech" />
          </Link>

          <nav
            aria-label="Primary"
            className={`primary-nav${open ? ' is-open' : ''}`}
            id="primary-navigation"
            ref={navRef}
          >
            <div className="mobile-nav__header" data-mobile-nav-reveal>
              <div className="mobile-nav__identity">
                <img
                  alt="GVT Gauvis Tech"
                  className="mobile-nav__logo"
                  height="204"
                  src={assets.logo}
                  width="575"
                />
              </div>
              <button
                aria-label="Close navigation menu"
                className="mobile-nav__close"
                onClick={() => closeMenu(true)}
                type="button"
              >
                <X aria-hidden="true" size={20} weight="bold" />
              </button>
            </div>

            <ul className="nav-list">
              {navItems.map((item, index) => (
                <li data-mobile-nav-reveal key={item.page}>
                  <Link
                    className="nav-link"
                    to={item.to}
                    aria-current={activePage === item.page ? 'page' : undefined}
                    onClick={() => closeMenu()}
                  >
                    <span className="nav-link__index" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span>{item.label}</span>
                    <ArrowRight className="nav-link__arrow" aria-hidden="true" size={17} weight="bold" />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mobile-nav__footer" data-mobile-nav-reveal>
              <p>
                <MapPin aria-hidden="true" size={15} weight="fill" />
                Serving businesses across South Africa
              </p>
              <Link
                className="button button--primary mobile-nav__quote"
                to="/contact#request-quote"
                onClick={() => closeMenu()}
              >
                <span>Request a Quote</span>
                <ArrowRight aria-hidden="true" size={16} weight="bold" />
              </Link>
            </div>
          </nav>

          <div
            aria-hidden="true"
            className={`mobile-nav-backdrop${open ? ' is-open' : ''}`}
          />

          <ButtonLink className="header-quote" href="/contact#request-quote">
            Request a Quote
          </ButtonLink>
          <button
            aria-controls="primary-navigation"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="menu-toggle"
            onClick={() => setOpen((current) => !current)}
            ref={toggleRef}
            type="button"
          >
            <span className="menu-toggle__bars" aria-hidden="true" />
          </button>
        </div>
      </header>
    </>
  )
}
