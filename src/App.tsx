import { useEffect } from 'react'
import { AnimatePresence, domAnimation, LazyMotion, m, useReducedMotion } from 'motion/react'
import { Route, Routes, useLocation, type Location } from 'react-router-dom'
import { SiteFooter } from './components/SiteFooter'
import { SiteHeader } from './components/SiteHeader'
import { About } from './pages/About'
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
  '/faq': 'FAQ | Gauvis Technology Holdings',
  '/contact': 'Contact Gauvis | Request an IT Quote',
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

type RouteSceneProps = {
  location: Location
  reduceMotion: boolean
}

function RouteScene({ location, reduceMotion }: RouteSceneProps) {
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

  return (
    <m.div
      animate={{ opacity: 1, transform: 'translate3d(0, 0, 0)' }}
      className="route-transition"
      exit={{
        opacity: 0,
        transform: reduceMotion ? 'translate3d(0, 0, 0)' : 'translate3d(0, -0.5rem, 0)',
      }}
      initial={{
        opacity: 0,
        transform: reduceMotion ? 'translate3d(0, 0, 0)' : 'translate3d(0, 0.75rem, 0)',
      }}
      transition={{
        duration: reduceMotion ? 0.12 : 0.22,
        ease: [0.23, 1, 0.32, 1],
      }}
    >
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </m.div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  const reduceMotion = Boolean(useReducedMotion())

  return (
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence initial={false} mode="wait">
        <RouteScene key={location.pathname} location={location} reduceMotion={reduceMotion} />
      </AnimatePresence>
    </LazyMotion>
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
      <AnimatedRoutes />
      <SiteFooter />
    </>
  )
}
