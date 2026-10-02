import { useRef, useState, type FormEvent } from 'react'
import { readEnquiryPayload, validateEnquiryPayload, type EnquiryPayload, type FieldName, type FormErrors } from './contactForm'

type ApiResponse = {
  accepted?: boolean
  fieldErrors?: Partial<Record<FieldName, string>>
  message?: string
}

export type SubmissionStatus = {
  kind: 'idle' | 'pending' | 'success' | 'error'
  message: string
}

type SubmissionResult =
  | { kind: 'success' }
  | { kind: 'validation'; errors: FormErrors }
  | { kind: 'error'; message: string }

const idleStatus: SubmissionStatus = { kind: 'idle', message: '' }
const fieldNames = new Set<FieldName>(['fullName', 'email', 'phone', 'service', 'message', 'consent'])
const genericError = 'We could not send your enquiry. Please try again or contact us by phone.'

function focusFirstInvalidField(form: HTMLFormElement, errors: FormErrors) {
  const firstInvalidField = Object.keys(errors)[0] as FieldName | undefined
  const field = firstInvalidField ? form.elements.namedItem(firstInvalidField) : null
  if (field instanceof HTMLElement) field.focus()
}

function readApiErrors(fieldErrors: ApiResponse['fieldErrors']): FormErrors {
  if (!fieldErrors) return {}
  return Object.fromEntries(
    Object.entries(fieldErrors).filter(
      (entry): entry is [FieldName, string] => fieldNames.has(entry[0] as FieldName) && typeof entry[1] === 'string',
    ),
  )
}

async function submitEnquiry(payload: EnquiryPayload): Promise<SubmissionResult> {
  try {
    const response = await fetch('/api/enquiries', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = (await response.json()) as ApiResponse

    if (response.status === 422) return { kind: 'validation', errors: readApiErrors(body.fieldErrors) }
    if (!response.ok || !body.accepted) return { kind: 'error', message: body.message || genericError }
    return { kind: 'success' }
  } catch {
    return { kind: 'error', message: genericError }
  }
}

export function useQuoteForm() {
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<SubmissionStatus>(idleStatus)
  const submissionInFlight = useRef(false)

  const clearError = (field: FieldName) => {
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
    if (status.kind !== 'pending') setStatus(idleStatus)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submissionInFlight.current) return

    const form = event.currentTarget
    const payload = readEnquiryPayload(form)
    const clientErrors = validateEnquiryPayload(payload)
    setErrors(clientErrors)

    if (Object.keys(clientErrors).length > 0) {
      setStatus({ kind: 'error', message: 'Please check the highlighted fields and try again.' })
      focusFirstInvalidField(form, clientErrors)
      return
    }

    submissionInFlight.current = true
    setStatus({ kind: 'pending', message: 'Sending your enquiry…' })
    const result = await submitEnquiry(payload)
    submissionInFlight.current = false

    if (result.kind === 'validation') {
      setErrors(result.errors)
      setStatus({ kind: 'error', message: 'Please check the highlighted fields and try again.' })
      focusFirstInvalidField(form, result.errors)
      return
    }

    if (result.kind === 'error') {
      setStatus({ kind: 'error', message: result.message })
      return
    }

    form.reset()
    setErrors({})
    setStatus({
      kind: 'success',
      message: 'Thank you. Your enquiry has been received. Our team will contact you using the details provided.',
    })
  }

  return { clearError, errors, handleSubmit, isPending: status.kind === 'pending', status }
}
