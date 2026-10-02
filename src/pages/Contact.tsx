import { Link } from 'react-router-dom'
import { assets } from '../assets'
import { ContactDetails } from '../features/contact/ContactDetails'
import { NextSteps } from '../features/contact/NextSteps'
import { QuoteForm } from '../features/contact/QuoteForm'

export function Contact() {
  return (
    <main id="main-content">
      <section className="contact-hero" aria-labelledby="contact-hero-title">
        <div className="site-shell contact-hero__inner">
          <div className="contact-hero__copy">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span aria-hidden="true">/</span>
              <span>Contact</span>
            </nav>
            <h1 id="contact-hero-title" tabIndex={-1}>
              Let’s Talk About <span>Your IT Needs.</span>
            </h1>
            <p>Tell us what you need and start a conversation with our team.</p>
          </div>
          <div className="contact-hero__media">
            <img
              src={assets.heroServerAisle}
              width="255"
              height="226"
              alt="Blue-lit server racks in a data centre"
              fetchPriority="high"
            />
          </div>
          <span className="contact-hero__accent" aria-hidden="true" />
        </div>
      </section>

      <section className="contact-main" aria-labelledby="contact-details-title">
        <div className="site-shell contact-main__grid">
          <ContactDetails />
          <QuoteForm />
        </div>
      </section>

      <NextSteps />
    </main>
  )
}
