import { z } from 'zod'

export const enquiryServices = [
  'Hardware Support',
  'Software Solutions',
  'Networking Services',
  'PC & Desktop Support',
  'Microsoft 365 Support',
  'CCTV & Security',
  'Printer Services',
  'Website Development',
] as const

const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Enter your phone number.')
  .max(40, 'Enter a valid phone number.')
  .regex(/^\+?[\d\s().-]+$/, 'Enter a valid phone number.')
  .refine((value) => {
    const digits = value.replace(/\D/g, '')
    return digits.length >= 7 && digits.length <= 15
  }, 'Enter a valid phone number.')

export const enquiryInputSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your full name.').max(120, 'Keep your name under 120 characters.'),
  businessName: z.string().trim().max(160, 'Keep the business name under 160 characters.').optional().default(''),
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address.')
    .max(254, 'Enter a valid email address.')
    .email('Enter a valid email address.')
    .transform((value) => value.toLowerCase()),
  phone: phoneSchema,
  service: z.enum(enquiryServices, { message: 'Select a service.' }),
  location: z.string().trim().max(160, 'Keep the location under 160 characters.').optional().default(''),
  message: z.string().trim().min(1, 'Tell us what you need.').max(4000, 'Keep your message under 4,000 characters.'),
  consent: z.literal(true, { message: 'Please agree to be contacted about your enquiry.' }),
  website: z.string().max(200).optional().default(''),
})

export type EnquiryInput = z.infer<typeof enquiryInputSchema>

export function getFieldErrors(error: z.ZodError<EnquiryInput>) {
  const flattened = z.flattenError(error).fieldErrors

  return Object.fromEntries(
    Object.entries(flattened).flatMap(([field, messages]) => {
      const firstMessage = messages?.[0]
      return firstMessage ? [[field, firstMessage]] : []
    }),
  )
}
