import {
  ArrowRight,
  ChatCircle,
  ClipboardText,
  FileText,
  MapPin,
  Phone,
  Truck,
  WhatsappLogo,
} from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../assets'

const services = [
  'Hardware Support',
  'Software Solutions',
  'Networking Services',
  'PC & Desktop Support',
  'Microsoft 365 Support',
  'CCTV & Security',
  'Printer Services',
  'Website Development',
] as const

const serviceValues = new Set<string>(services)
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneCharactersPattern = /^\+?[\d\s().-]+$/

const nextSteps = [
  {
    number: '01',
    title: 'We review your enquiry',
    description: 'Our team will take a look at your details and understand your needs.',
    Icon: ClipboardText,
  },
  {
    number: '02',
    title: 'We discuss your requirements',
    description: 'We’ll get in touch to discuss the best solution for your business.',
    Icon: ChatCircle,
  },
  {
    number: '03',
    title: 'We prepare your quote',
    description: 'You’ll receive a tailored quote based on your specific requirements.',
    Icon: FileText,
  },
] as const

type FieldName = 'fullName' | 'email' | 'phone' | 'service' | 'message' | 'consent'
type FormErrors = Partial<Record<FieldName, string>>

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p className="field-error" id={id}>
      {message}
    </p>
  ) : null
}

function validatePhone(value: string) {
  const digits = value.replace(/\D/g, '')
  return phoneCharactersPattern.test(value) && digits.length >= 7 && digits.length <= 15
}

export function Contact() {
  const [errors, setErrors] = useState<FormErrors>({})
  const [formStatus, setFormStatus] = useState('')

  const clearError = (field: FieldName) => {
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
    if (formStatus) setFormStatus('')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const fullName = String(data.get('fullName') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    const phone = String(data.get('phone') ?? '').trim()
    const service = String(data.get('service') ?? '')
    const message = String(data.get('message') ?? '').trim()
    const consent = data.get('consent') === 'on'
    const nextErrors: FormErrors = {}

    if (!fullName) nextErrors.fullName = 'Enter your full name.'
    if (!email) nextErrors.email = 'Enter your email address.'
    else if (!emailPattern.test(email)) nextErrors.email = 'Enter a valid email address.'
    if (!phone) nextErrors.phone = 'Enter your phone number.'
    else if (!validatePhone(phone)) nextErrors.phone = 'Enter a valid phone number.'
    if (!serviceValues.has(service)) nextErrors.service = 'Select a service.'
    if (!message) nextErrors.message = 'Tell us what you need.'
    if (!consent) nextErrors.consent = 'Please agree to be contacted about your enquiry.'

    setErrors(nextErrors)

    const firstInvalidField = Object.keys(nextErrors)[0] as FieldName | undefined
    if (firstInvalidField) {
      setFormStatus('Please check the highlighted fields and try again.')
      const field = form.elements.namedItem(firstInvalidField)
      if (field instanceof HTMLElement) field.focus()
      return
    }

    setFormStatus(
      'Online enquiry delivery is not configured yet. Please call Thabang or Pontsho to discuss your request.',
    )
  }

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
          <div className="contact-details">
            <h2 id="contact-details-title">Get in touch</h2>
            <p className="contact-details__intro">
              We’re here to help. Reach out to discuss your IT needs, request a quote or find out more about our
              services.
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

            <button
              className="whatsapp-button"
              type="button"
              disabled
              aria-describedby="whatsapp-unavailable"
            >
              <WhatsappLogo aria-hidden="true" size={31} weight="regular" />
              <span>Chat on WhatsApp</span>
            </button>
            <span className="visually-hidden" id="whatsapp-unavailable">
              A WhatsApp recipient has not been configured.
            </span>
          </div>

          <div className="quote-card" id="request-quote">
            <h2>Request a Quote</h2>
            <p className="quote-card__intro">Share a few details about your project or support needs.</p>

            <form className="quote-form" noValidate onSubmit={handleSubmit}>
              <div className="quote-form__row">
                <div className="form-field">
                  <label htmlFor="quote-full-name">
                    Full name <span className="required-mark" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="quote-full-name"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    required
                    aria-invalid={errors.fullName ? 'true' : undefined}
                    aria-describedby={errors.fullName ? 'quote-full-name-error' : undefined}
                    onInput={() => clearError('fullName')}
                  />
                  <FieldError id="quote-full-name-error" message={errors.fullName} />
                </div>
                <div className="form-field">
                  <label htmlFor="quote-business-name">Business name (optional)</label>
                  <input
                    id="quote-business-name"
                    name="businessName"
                    type="text"
                    autoComplete="organization"
                    placeholder="Enter your business name"
                  />
                </div>
              </div>

              <div className="quote-form__row">
                <div className="form-field">
                  <label htmlFor="quote-email">
                    Email address <span className="required-mark" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="quote-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    spellCheck="false"
                    placeholder="Enter your email address"
                    required
                    aria-invalid={errors.email ? 'true' : undefined}
                    aria-describedby={errors.email ? 'quote-email-error' : undefined}
                    onInput={() => clearError('email')}
                  />
                  <FieldError id="quote-email-error" message={errors.email} />
                </div>
                <div className="form-field">
                  <label htmlFor="quote-phone">
                    Phone number <span className="required-mark" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="quote-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="Enter your phone number"
                    required
                    aria-invalid={errors.phone ? 'true' : undefined}
                    aria-describedby={errors.phone ? 'quote-phone-error' : undefined}
                    onInput={() => clearError('phone')}
                  />
                  <FieldError id="quote-phone-error" message={errors.phone} />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="quote-service">
                  Service required <span className="required-mark" aria-hidden="true">*</span>
                </label>
                <select
                  id="quote-service"
                  name="service"
                  defaultValue=""
                  autoComplete="off"
                  required
                  aria-invalid={errors.service ? 'true' : undefined}
                  aria-describedby={errors.service ? 'quote-service-error' : undefined}
                  onChange={() => clearError('service')}
                >
                  <option value="" disabled>Select a service</option>
                  {services.map((service) => (
                    <option value={service} key={service}>{service}</option>
                  ))}
                </select>
                <FieldError id="quote-service-error" message={errors.service} />
              </div>

              <div className="form-field">
                <label htmlFor="quote-location">Location</label>
                <input
                  id="quote-location"
                  name="location"
                  type="text"
                  autoComplete="address-level2"
                  placeholder="Enter your location (e.g. City, Province)"
                />
              </div>

              <div className="form-field">
                <label htmlFor="quote-message">
                  Tell us what you need <span className="required-mark" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="quote-message"
                  name="message"
                  rows={4}
                  autoComplete="off"
                  placeholder="Provide details about your project or support needs…"
                  required
                  aria-invalid={errors.message ? 'true' : undefined}
                  aria-describedby={errors.message ? 'quote-message-error' : undefined}
                  onInput={() => clearError('message')}
                />
                <FieldError id="quote-message-error" message={errors.message} />
              </div>

              <div className="consent-field">
                <label htmlFor="quote-consent">
                  <input
                    id="quote-consent"
                    name="consent"
                    type="checkbox"
                    required
                    aria-invalid={errors.consent ? 'true' : undefined}
                    aria-describedby={errors.consent ? 'quote-consent-error' : undefined}
                    onChange={() => clearError('consent')}
                  />
                  <span>I agree to be contacted about my enquiry.</span>
                </label>
                <FieldError id="quote-consent-error" message={errors.consent} />
              </div>

              <button className="send-enquiry-button" type="submit">
                <span>Send Enquiry</span>
                <ArrowRight aria-hidden="true" size={19} weight="bold" />
              </button>
              <p className={`form-status${formStatus ? ' is-visible' : ''}`} role="alert" aria-live="polite">
                {formStatus}
              </p>
            </form>
          </div>
        </div>
      </section>

      <section className="next-steps" aria-labelledby="next-steps-title">
        <div className="site-shell">
          <h2 id="next-steps-title">What happens next?</h2>
          <p className="next-steps__intro">We’ll guide you through the next steps.</p>
          <div className="next-steps__grid">
            {nextSteps.map(({ number, title, description, Icon }) => (
              <article className="next-step" key={number}>
                <span className="next-step__number">{number}</span>
                <div>
                  <Icon aria-hidden="true" className="next-step__icon" size={33} weight="regular" />
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
