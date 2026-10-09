import { contactServices, type FieldName, type FormErrors } from './contactForm'

type QuoteFieldsProps = {
  clearError: (field: FieldName) => void
  errors: FormErrors
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p className="field-error" id={id}>{message}</p> : null
}

export function ContactIdentityFields({ clearError, errors }: QuoteFieldsProps) {
  return (
    <>
      <div className="quote-form__row">
        <div className="form-field">
          <label htmlFor="quote-full-name">Full name <span className="required-mark" aria-hidden="true">*</span></label>
          <input id="quote-full-name" name="fullName" type="text" autoComplete="name" placeholder="Enter your full name" required aria-invalid={errors.fullName ? 'true' : undefined} aria-describedby={errors.fullName ? 'quote-full-name-error' : undefined} onInput={() => clearError('fullName')} />
          <FieldError id="quote-full-name-error" message={errors.fullName} />
        </div>
        <div className="form-field">
          <label htmlFor="quote-business-name">Business name (optional)</label>
          <input id="quote-business-name" name="businessName" type="text" autoComplete="organization" placeholder="Enter your business name" />
        </div>
      </div>
      <div className="quote-form__row">
        <div className="form-field">
          <label htmlFor="quote-email">Email address <span className="required-mark" aria-hidden="true">*</span></label>
          <input id="quote-email" name="email" type="email" autoComplete="email" inputMode="email" spellCheck="false" placeholder="Enter your email address" required aria-invalid={errors.email ? 'true' : undefined} aria-describedby={errors.email ? 'quote-email-error' : undefined} onInput={() => clearError('email')} />
          <FieldError id="quote-email-error" message={errors.email} />
        </div>
        <div className="form-field">
          <label htmlFor="quote-phone">Phone number <span className="required-mark" aria-hidden="true">*</span></label>
          <input id="quote-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="Enter your phone number" required aria-invalid={errors.phone ? 'true' : undefined} aria-describedby={errors.phone ? 'quote-phone-error' : undefined} onInput={() => clearError('phone')} />
          <FieldError id="quote-phone-error" message={errors.phone} />
        </div>
      </div>
    </>
  )
}

export function EnquiryDetailFields({ clearError, errors }: QuoteFieldsProps) {
  return (
    <>
      <div className="form-field">
        <label htmlFor="quote-service">Service required <span className="required-mark" aria-hidden="true">*</span></label>
        <select id="quote-service" name="service" defaultValue="" autoComplete="off" required aria-invalid={errors.service ? 'true' : undefined} aria-describedby={errors.service ? 'quote-service-error' : undefined} onChange={() => clearError('service')}>
          <option value="" disabled>Select a service</option>
          {contactServices.map((service) => <option value={service} key={service}>{service}</option>)}
        </select>
        <FieldError id="quote-service-error" message={errors.service} />
      </div>
      <div className="form-field">
        <label htmlFor="quote-location">Location</label>
        <input id="quote-location" name="location" type="text" autoComplete="address-level2" placeholder="Enter your location (e.g. City, Province)" />
      </div>
      <div className="form-field">
        <label htmlFor="quote-message">Tell us what you need <span className="required-mark" aria-hidden="true">*</span></label>
        <textarea id="quote-message" name="message" rows={4} autoComplete="off" placeholder="Provide details about your project or support needs…" required aria-invalid={errors.message ? 'true' : undefined} aria-describedby={errors.message ? 'quote-message-error' : undefined} onInput={() => clearError('message')} />
        <FieldError id="quote-message-error" message={errors.message} />
      </div>
      <div className="form-honeypot" aria-hidden="true">
        <label htmlFor="quote-website">Website</label>
        <input id="quote-website" name="website" type="text" autoComplete="off" tabIndex={-1} />
      </div>
    </>
  )
}

export function ConsentField({ clearError, errors }: QuoteFieldsProps) {
  return (
    <div className="consent-field">
      <label htmlFor="quote-consent">
        <input id="quote-consent" name="consent" type="checkbox" required aria-invalid={errors.consent ? 'true' : undefined} aria-describedby={errors.consent ? 'quote-consent-error' : undefined} onChange={() => clearError('consent')} />
        <span>I agree to be contacted about my enquiry.</span>
      </label>
      <FieldError id="quote-consent-error" message={errors.consent} />
    </div>
  )
}
