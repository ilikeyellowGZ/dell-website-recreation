export const contactServices = [
  'Hardware Support',
  'Software Solutions',
  'Networking Services',
  'PC & Desktop Support',
  'Microsoft 365 Support',
  'CCTV & Security',
  'Printer Services',
  'Website Development',
] as const

export type FieldName = 'fullName' | 'email' | 'phone' | 'service' | 'message' | 'consent'
export type FormErrors = Partial<Record<FieldName, string>>

export type EnquiryPayload = {
  businessName: string
  consent: boolean
  email: string
  fullName: string
  location: string
  message: string
  phone: string
  service: string
  website: string
}

const serviceValues = new Set<string>(contactServices)
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneCharactersPattern = /^\+?[\d\s().-]+$/

function validatePhone(value: string) {
  const digits = value.replace(/\D/g, '')
  return phoneCharactersPattern.test(value) && digits.length >= 7 && digits.length <= 15
}

export function readEnquiryPayload(form: HTMLFormElement): EnquiryPayload {
  const data = new FormData(form)

  return {
    fullName: String(data.get('fullName') ?? '').trim(),
    businessName: String(data.get('businessName') ?? '').trim(),
    email: String(data.get('email') ?? '').trim(),
    phone: String(data.get('phone') ?? '').trim(),
    service: String(data.get('service') ?? ''),
    location: String(data.get('location') ?? '').trim(),
    message: String(data.get('message') ?? '').trim(),
    consent: data.get('consent') === 'on',
    website: String(data.get('website') ?? ''),
  }
}

export function validateEnquiryPayload(payload: EnquiryPayload): FormErrors {
  const errors: FormErrors = {}

  if (!payload.fullName) errors.fullName = 'Enter your full name.'
  if (!payload.email) errors.email = 'Enter your email address.'
  else if (!emailPattern.test(payload.email)) errors.email = 'Enter a valid email address.'
  if (!payload.phone) errors.phone = 'Enter your phone number.'
  else if (!validatePhone(payload.phone)) errors.phone = 'Enter a valid phone number.'
  if (!serviceValues.has(payload.service)) errors.service = 'Select a service.'
  if (!payload.message) errors.message = 'Tell us what you need.'
  if (!payload.consent) errors.consent = 'Please agree to be contacted about your enquiry.'

  return errors
}
