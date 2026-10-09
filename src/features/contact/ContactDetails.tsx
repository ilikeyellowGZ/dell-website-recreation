import { MapPin, Phone, Truck, WhatsappLogo } from '@phosphor-icons/react'

export const thabangWhatsAppUrl = 'https://wa.me/27840356925'

export function ContactDetails() {
  return (
    <div className="contact-details">
      <h2 id="contact-details-title">Get in touch</h2>
      <p className="contact-details__intro">
        We’re here to help. Reach out to discuss your IT needs, request a quote or find out more about our services.
      </p>

      <div className="contact-card-list">
        <a className="contact-card" href="tel:+27840356925" aria-label="Thabang 084 035 6925">
          <span className="contact-card__icon" aria-hidden="true">
            <Phone size={28} weight="fill" />
          </span>
          <span>
            <strong>Thabang</strong>
            <span>084 035 6925</span>
          </span>
        </a>
        <a className="contact-card" href="tel:+27643670274" aria-label="Pontsho 064 367 0274">
          <span className="contact-card__icon" aria-hidden="true">
            <Phone size={28} weight="fill" />
          </span>
          <span>
            <strong>Pontsho</strong>
            <span>064 367 0274</span>
          </span>
        </a>
        <div className="contact-card">
          <span className="contact-card__icon" aria-hidden="true">
            <MapPin size={28} weight="fill" />
          </span>
          <strong>Serving South Africa</strong>
        </div>
      </div>

      <aside className="on-site-panel" aria-labelledby="on-site-title">
        <span className="on-site-panel__icon" aria-hidden="true">
          <Truck size={35} weight="bold" />
        </span>
        <div>
          <h3 id="on-site-title">We come to you</h3>
          <p>We can discuss your requirements and provide on-site assistance across South Africa.</p>
        </div>
      </aside>

      <a className="whatsapp-button" href={thabangWhatsAppUrl} rel="noreferrer" target="_blank">
        <WhatsappLogo aria-hidden="true" size={31} weight="regular" />
        <span>Chat on WhatsApp</span>
      </a>
    </div>
  )
}
