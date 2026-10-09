import { ArrowRight } from '@phosphor-icons/react'
import { ConsentField, ContactIdentityFields, EnquiryDetailFields } from './QuoteFields'
import { useQuoteForm } from './useQuoteForm'

export function QuoteForm() {
  const { clearError, errors, handleSubmit, isPending, status } = useQuoteForm()

  return (
    <div className="quote-card" id="request-quote">
      <h2>Request a Quote</h2>
      <p className="quote-card__intro">Share a few details about your project or support needs.</p>
      <form className="quote-form" noValidate onSubmit={handleSubmit}>
        <ContactIdentityFields clearError={clearError} errors={errors} />
        <EnquiryDetailFields clearError={clearError} errors={errors} />
        <ConsentField clearError={clearError} errors={errors} />
        <button className="send-enquiry-button" type="submit" disabled={isPending}>
          <span>{isPending ? 'Sending Enquiry…' : 'Send Enquiry'}</span>
          <ArrowRight aria-hidden="true" size={19} weight="bold" />
        </button>
        {status.message ? (
          <p className={`form-status form-status--${status.kind}`} role={status.kind === 'error' ? 'alert' : 'status'} aria-live="polite">{status.message}</p>
        ) : null}
      </form>
    </div>
  )
}
