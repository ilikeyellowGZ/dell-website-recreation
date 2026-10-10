import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation, type Location } from 'react-router-dom'
import { SiteFooter } from './components/SiteFooter'
import { SiteHeader } from './components/SiteHeader'

const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })))
const About = lazy(() => import('./pages/About').then((module) => ({ default: module.About })))
const Services = lazy(() => import('./pages/Services').then((module) => ({ default: module.Services })))
const Solutions = lazy(() => import('./pages/Solutions').then((module) => ({ default: module.Solutions })))
const FAQ = lazy(() => import('./pages/FAQ').then((module) => ({ default: module.FAQ })))
const Contact = lazy(() => import('./pages/Contact').then((module) => ({ default: module.Contact })))
const AdminLogin = lazy(() => import('./pages/AdminLogin').then((module) => ({ default: module.AdminLogin })))
const AdminEnquiries = lazy(() =>
  import('./pages/AdminEnquiries').then((module) => ({ default: module.AdminEnquiries })),
)

const routeTitles: Record<string, string> = {
  '/': 'Gauvis Technology Holdings | IT Solutions for South Africa',
  '/about': 'About Gauvis | Technology Partner for South Africa',
  '/services': 'Services | Gauvis Technology Holdings',
  '/solutions': 'Solutions | Gauvis Technology Holdings',
  '/faq': 'FAQ | Gauvis Technology Holdings',
  '/contact': 'Contact Gauvis | Request an IT Quote',
  '/admin/login': 'Admin Sign In | Gauvis Technology Holdings',
  '/admin/enquiries': 'Website Enquiries | Gauvis Technology Holdings',
}

const activePageByPath = {
  '/': 'home',
  '/about': 'about',
  '/services': 'services',
  '/solutions': 'solutions',
  '/faq': 'faq',
  '/contact': 'contact',
} as const

function RouteEffects() {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = routeTitles[pathname] ?? routeTitles['/']
  }, [pathname])

  return null
}

function ReadyRouteEffects({ location }: { location: Location }) {
  const { hash, pathname } = location

  useEffect(() => {
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

function LazyRoutes() {
  const location = useLocation()

  return (
    <div className="route-transition" key={location.pathname}>
      <Suspense
        fallback={
          <main className="route-loading" id="main-content">
            <p role="status">Loading page…</p>
          </main>
        }
      >
        <ReadyRouteEffects location={location} />
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/enquiries" element={<AdminEnquiries />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>
    </div>
  )
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
      <LazyRoutes />
      <SiteFooter />
    </>
  )
}
