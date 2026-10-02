import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { SiteFooter } from './components/SiteFooter'
import { SiteHeader } from './components/SiteHeader'
import { About } from './pages/About'
import { Home } from './pages/Home'

const routeTitles: Record<string, string> = {
  '/': 'Gauvis Technology Holdings | IT Solutions for South Africa',
  '/about': 'About Gauvis | Technology Partner for South Africa',
}

function RouteEffects() {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = routeTitles[pathname] ?? routeTitles['/']
    if (!navigator.userAgent.toLowerCase().includes('jsdom')) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }
    queueMicrotask(() => document.querySelector<HTMLElement>('main h1')?.focus())
  }, [pathname])

  return null
}

export function App() {
  const { pathname } = useLocation()
  const activePage = pathname === '/about' ? 'about' : 'home'

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
        <Route path="*" element={<Home />} />
      </Routes>
      <SiteFooter />
    </>
  )
}
