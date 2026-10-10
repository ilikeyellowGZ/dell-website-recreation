import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { login } from '../features/admin/adminApi'
import '../styles/admin.css'

export function AdminLogin() {
  const navigate = useNavigate()
  const [authenticated, setAuthenticated] = useState(false)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    const form = event.currentTarget
    const formData = new FormData(form)
    setPending(true)
    setMessage('')
    try {
      const result = await login({
        password: String(formData.get('password') || ''),
        username: String(formData.get('username') || ''),
      })
      if (!result.authenticated) {
        setMessage(result.message || 'Sign-in failed.')
        return
      }
      setAuthenticated(true)
      navigate('/admin/enquiries', { replace: true })
    } catch {
      setMessage('Admin sign-in is temporarily unavailable.')
    } finally {
      setPending(false)
    }
  }

  if (authenticated) return <Navigate replace to="/admin/enquiries" />

  return (
    <main className="admin-page" id="main-content">
      <section className="admin-login" aria-labelledby="admin-login-title">
        <div className="admin-card">
          <p className="section-kicker">Restricted access</p>
          <h1 id="admin-login-title" tabIndex={-1}>Admin sign in</h1>
          <p>Use the credentials configured for Gauvis Technology enquiry administration.</p>
          <form onSubmit={handleSubmit}>
            <label htmlFor="admin-username">Username</label>
            <input autoComplete="username" id="admin-username" name="username" required />
            <label htmlFor="admin-password">Password</label>
            <input autoComplete="current-password" id="admin-password" name="password" required type="password" />
            <button className="button button--primary" disabled={pending} type="submit">
              {pending ? 'Signing in…' : 'Sign in'}
            </button>
            {message ? <p className="admin-error" role="alert">{message}</p> : null}
          </form>
        </div>
      </section>
    </main>
  )
}
