import { MapPin, Phone } from '@phosphor-icons/react'
import { Link, useLocation } from 'react-router-dom'
import { assets } from '../assets'

const services = [
  'Hardware Support',
  'Software Solutions',
  'Networking Services',
  'PC & Desktop Support',
  'Microsoft 365 Support',
  'CCTV & Security',
  'Printer Services',
  'Web Development',
]

export function SiteFooter() {
  const { pathname } = useLocation()

  return (
    <footer className="site-footer">
      <div className="site-shell footer-grid">
        <div className="footer-brand">
          <Link to="/" aria-label="Gauvis Tech homepage">
            <img src={assets.logo} width="575" height="204" alt="GVT Gauvis Tech" />
          </Link>
          <p>
            Gauvis Technology Holdings is an IT solutions provider delivering hardware, software, networks and support
            services across South Africa.
          </p>
        </div>

        <div>
          <h2 className="footer-heading">Quick Links</h2>
          <ul className="footer-links">
            <li><Link aria-label="Homepage" to="/">Home</Link></li>
            <li><Link aria-label="About Gauvis" to="/about">About</Link></li>
            <li>
              <Link className={pathname === '/services' ? 'is-current' : undefined} to="/services">
                Services
              </Link>
            </li>
            <li>
              <Link className={pathname === '/solutions' ? 'is-current' : undefined} to="/solutions">
                Solutions
              </Link>
            </li>
            <li>
              <Link className={pathname === '/case-studies' ? 'is-current' : undefined} to="/case-studies">
                Case Studies
              </Link>
            </li>
            <li>
              <Link className={pathname === '/faq' ? 'is-current' : undefined} to="/faq">
                FAQ
              </Link>
            </li>
            <li>
              <Link className={pathname === '/contact' ? 'is-current' : undefined} to="/contact">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="footer-heading">Services</h2>
          <ul className="footer-links">
            {services.map((service) => (
              <li key={service}>
                <Link to="/services">{service}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div id="footer-contact">
          <h2 className="footer-heading">South Africa</h2>
          <ul className="footer-links footer-contact">
            <li className="contact-item">
              <MapPin aria-hidden="true" size={18} weight="fill" />
              <span>Serving Businesses<br />Across South Africa</span>
            </li>
            <li>
              <a className="contact-item" href="tel:+27840356925">
                <Phone aria-hidden="true" size={18} weight="fill" />
                <span>Thabang: 084 035 6925</span>
              </a>
            </li>
            <li>
              <a className="contact-item" href="tel:+27643670274">
                <Phone aria-hidden="true" size={18} weight="fill" />
                <span>Pontsho: 064 367 0274</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="site-shell footer-bottom__inner">
          <span>© 2026 Gauvis Technology Holdings. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}
