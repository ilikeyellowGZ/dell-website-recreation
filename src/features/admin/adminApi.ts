import { apiUrl } from '../../config/api'

export type AdminEnquiry = {
  businessName: string
  createdAt: string
  email: string
  fullName: string
  location: string
  message: string
  phone: string
  service: string
  status: 'new'
}

export type LoginInput = {
  password: string
  username: string
}

type LoginResult = {
  authenticated: boolean
  message?: string
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const response = await fetch(apiUrl('/api/admin/login'), {
    body: JSON.stringify(input),
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  const result = (await response.json()) as LoginResult
  if (!response.ok) return { authenticated: false, message: result.message || 'Sign-in failed.' }
  return result
}

export async function getSession(): Promise<boolean> {
  const response = await fetch(apiUrl('/api/admin/session'), { credentials: 'include' })
  return response.ok
}

export async function getEnquiries(): Promise<AdminEnquiry[]> {
  const response = await fetch(apiUrl('/api/admin/enquiries'), { credentials: 'include' })
  if (response.status === 401) throw new Error('AUTHENTICATION_REQUIRED')
  if (!response.ok) throw new Error('Enquiry records are temporarily unavailable.')
  const result = (await response.json()) as { enquiries?: AdminEnquiry[] }
  return Array.isArray(result.enquiries) ? result.enquiries : []
}

export async function logout(): Promise<void> {
  await fetch(apiUrl('/api/admin/logout'), { credentials: 'include', method: 'POST' })
}
