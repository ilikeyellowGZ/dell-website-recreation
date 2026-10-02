import { MapPin, Phone } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { assets } from '../assets'

const services = [
  'Hardware & Devices',
  'Software Solutions',
  'Networking & Infrastructure',
  'IT Support & Maintenance',
  'Security Solutions',
  'Web Development',
]

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-shell footer-grid">
        <div className="footer-brand">
          <Link to="/" aria-label="Gauvis Tech homepage">
            <img src={assets.logo} width="575" height="204" alt="GVT Gauvis Tech" />
          </Link>
          <p>
            Gauvis Technology Holdings provides practical IT solutions to help businesses stay connected, secure and
            productive across South Africa.
          </p>
        </div>

        <div>
          <h2 className="footer-heading">Quick Links</h2>
          <ul className="footer-links">
            <li><Link aria-label="Homepage" to="/">Home</Link></li>
            <li><Link aria-label="About Gauvis" to="/about">About</Link></li>
            <li><a href="/services.html">Services</a></li>
            <li><span aria-disabled="true">Solutions</span></li>
            <li><span aria-disabled="true">Case Studies</span></li>
            <li><span aria-disabled="true">FAQ</span></li>
            <li><a href="#footer-contact">Contact</a></li>
          </ul>
        </div>

        <div>
          <h2 className="footer-heading">Services</h2>
          <ul className="footer-links">
            {services.map((service) => (
              <li key={service}>
                <a href="/services.html">{service}</a>
              </li>
            ))}
          </ul>
        </div>

        <div id="footer-contact">
          <h2 className="footer-heading">Contact</h2>
          <ul className="footer-links footer-contact">
            <li className="contact-item">
              <MapPin aria-hidden="true" size={18} weight="fill" />
              <span>South Africa</span>
            </li>
            <li>
              <a className="contact-item" href="tel:0840356925">
                <Phone aria-hidden="true" size={18} weight="fill" />
                <span>Thabang: 084 035 6925</span>
              </a>
            </li>
            <li>
              <a className="contact-item" href="tel:0643670274">
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
          <div className="legal-links" aria-label="Legal links">
            <span>Privacy Policy</span>
            <span aria-hidden="true">|</span>
            <span>Terms &amp; Conditions</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
