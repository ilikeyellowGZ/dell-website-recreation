import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { SiteFooter } from './components/SiteFooter'
import { SiteHeader } from './components/SiteHeader'
import { About } from './pages/About'
import { CaseStudies } from './pages/CaseStudies'
import { Contact } from './pages/Contact'
import { FAQ } from './pages/FAQ'
import { Home } from './pages/Home'
import { Services } from './pages/Services'
import { Solutions } from './pages/Solutions'

const routeTitles: Record<string, string> = {
  '/': 'Gauvis Technology Holdings | IT Solutions for South Africa',
  '/about': 'About Gauvis | Technology Partner for South Africa',
  '/services': 'Services | Gauvis Technology Holdings',
  '/solutions': 'Solutions | Gauvis Technology Holdings',
  '/case-studies': 'Case Studies | Gauvis Technology Holdings',
  '/faq': 'FAQ | Gauvis Technology Holdings',
  '/contact': 'Contact Gauvis | Request an IT Quote',
}

const activePageByPath = {
  '/': 'home',
  '/about': 'about',
  '/services': 'services',
  '/solutions': 'solutions',
  '/case-studies': 'case-studies',
  '/faq': 'faq',
  '/contact': 'contact',
} as const

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
  const activePage = activePageByPath[pathname as keyof typeof activePageByPath] ?? 'home'

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
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/case-studies" element={<CaseStudies />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <SiteFooter />
    </>
  )
}
