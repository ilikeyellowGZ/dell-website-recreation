import { ArrowRight } from '@phosphor-icons/react'
import { ConsentField, ContactIdentityFields, EnquiryDetailFields } from './QuoteFields'
import { enquiriesEnabled } from './enquiryAvailability'
import { useQuoteForm } from './useQuoteForm'

export function QuoteForm() {
  const { clearError, errors, handleSubmit, isPending, status } = useQuoteForm()

  return (
    <div className="quote-card" id="request-quote">
      <h2>Request a Quote</h2>
      <p className="quote-card__intro">Share a few details about your project or support needs.</p>
      {!enquiriesEnabled ? (
        <div className="enquiry-unavailable" id="enquiry-unavailable" role="status">
          <strong>Online enquiries are not open yet.</strong>
          <p>
            Please call <a href="tel:+27840356925">084 035 6925</a> or use{' '}
            <a href="https://wa.me/27840356925" rel="noreferrer" target="_blank">WhatsApp</a> in the meantime.
          </p>
        </div>
      ) : null}
      <form className="quote-form" noValidate onSubmit={handleSubmit}>
        <fieldset aria-describedby={!enquiriesEnabled ? 'enquiry-unavailable' : undefined} disabled={!enquiriesEnabled}>
          <ContactIdentityFields clearError={clearError} errors={errors} />
          <EnquiryDetailFields clearError={clearError} errors={errors} />
          <ConsentField clearError={clearError} errors={errors} />
          <button className="send-enquiry-button" type="submit" disabled={isPending || !enquiriesEnabled}>
            <span>{isPending ? 'Sending Enquiry…' : 'Send Enquiry'}</span>
            <ArrowRight aria-hidden="true" size={19} weight="bold" />
          </button>
        </fieldset>
        {status.message ? (
          <p className={`form-status form-status--${status.kind}`} role={status.kind === 'error' ? 'alert' : 'status'} aria-live="polite">{status.message}</p>
        ) : null}
      </form>
    </div>
  )
}
