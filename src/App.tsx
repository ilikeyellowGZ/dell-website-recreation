import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { SiteFooter } from './components/SiteFooter'
import { SiteHeader } from './components/SiteHeader'
import { About } from './pages/About'
import { Contact } from './pages/Contact'
import { Home } from './pages/Home'
import { Services } from './pages/Services'

const routeTitles: Record<string, string> = {
  '/': 'Gauvis Technology Holdings | IT Solutions for South Africa',
  '/about': 'About Gauvis | Technology Partner for South Africa',
  '/services': 'Services | Gauvis Technology Holdings',
  '/contact': 'Contact Gauvis | Request an IT Quote',
}

function RouteEffects() {
  const { hash, pathname } = useLocation()

  useEffect(() => {
    document.title = routeTitles[pathname] ?? routeTitles['/']
    if (!navigator.userAgent.toLowerCase().includes('jsdom')) {
      if (hash) {
        requestAnimationFrame(() => document.querySelector<HTMLElement>(hash)?.scrollIntoView({ block: 'start' }))
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      }
    }
    if (!hash) queueMicrotask(() => document.querySelector<HTMLElement>('main h1')?.focus())
  }, [hash, pathname])

  return null
}

export function App() {
  const { pathname } = useLocation()
  const activePage =
    pathname === '/about' ? 'about' : pathname === '/services' ? 'services' : pathname === '/contact' ? 'contact' : 'home'

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <RouteEffects />
      <SiteHeader activePage={activePage} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <SiteFooter />
    </>
  )
}
