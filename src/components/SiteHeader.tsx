import { MapPin } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../assets'
import { ButtonLink } from './ButtonLink'

type ActivePage = 'home' | 'about' | 'services' | 'solutions' | 'case-studies' | 'faq' | 'contact'

type SiteHeaderProps = {
  activePage: ActivePage
}

export function SiteHeader({ activePage }: SiteHeaderProps) {
  const [open, setOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const closeMenu = (restoreFocus = false) => {
    setOpen(false)
    if (restoreFocus) queueMicrotask(() => toggleRef.current?.focus())
  }

  useEffect(() => {
    document.body.classList.toggle('menu-open', open)
    if (open) queueMicrotask(() => navRef.current?.querySelector<HTMLAnchorElement>('a')?.focus())

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) closeMenu(true)
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (open && !navRef.current?.contains(target) && !toggleRef.current?.contains(target)) closeMenu()
    }
    const media = window.matchMedia('(min-width: 64rem)')
    const onMediaChange = (event: MediaQueryListEvent) => {
      if (event.matches) closeMenu()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    media.addEventListener('change', onMediaChange)

    return () => {
      document.body.classList.remove('menu-open')
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
      media.removeEventListener('change', onMediaChange)
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
            <ul className="nav-list">
              <li>
                <Link
                  className="nav-link"
                  to="/"
                  aria-current={activePage === 'home' ? 'page' : undefined}
                  onClick={() => closeMenu()}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  className="nav-link"
                  to="/about"
                  aria-current={activePage === 'about' ? 'page' : undefined}
                  onClick={() => closeMenu()}
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  className="nav-link"
                  to="/services"
                  aria-current={activePage === 'services' ? 'page' : undefined}
                  onClick={() => closeMenu()}
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  className="nav-link"
                  to="/solutions"
                  aria-current={activePage === 'solutions' ? 'page' : undefined}
                  onClick={() => closeMenu()}
                >
                  Solutions
                </Link>
              </li>
              <li>
                <Link
                  className="nav-link"
                  to="/case-studies"
                  aria-current={activePage === 'case-studies' ? 'page' : undefined}
                  onClick={() => closeMenu()}
                >
                  Case Studies
                </Link>
              </li>
              <li>
                <Link
                  className="nav-link"
                  to="/faq"
                  aria-current={activePage === 'faq' ? 'page' : undefined}
                  onClick={() => closeMenu()}
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  className="nav-link"
                  to="/contact"
                  aria-current={activePage === 'contact' ? 'page' : undefined}
                  onClick={() => closeMenu()}
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

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
