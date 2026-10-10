import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEnquiries, getSession, logout, type AdminEnquiry } from '../features/admin/adminApi'
import '../styles/admin.css'

export function AdminEnquiries() {
  const navigate = useNavigate()
  const [enquiries, setEnquiries] = useState<AdminEnquiry[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        if (!(await getSession())) {
          navigate('/admin/login', { replace: true })
          return
        }
        const records = await getEnquiries()
        if (active) {
          setEnquiries(records)
          setState('ready')
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'AUTHENTICATION_REQUIRED') {
          navigate('/admin/login', { replace: true })
          return
        }
        if (active) setState('error')
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [navigate])

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <main className="admin-page" id="main-content">
      <section className="admin-enquiries" aria-labelledby="admin-enquiries-title">
        <div className="site-shell">
          <header className="admin-enquiries__header">
            <div>
              <p className="section-kicker">Gauvis administration</p>
              <h1 id="admin-enquiries-title" tabIndex={-1}>Website enquiries</h1>
            </div>
            <button className="button button--primary" onClick={handleLogout} type="button">Sign out</button>
          </header>
          {state === 'loading' ? <p role="status">Loading enquiries…</p> : null}
          {state === 'error' ? <p className="admin-error" role="alert">Enquiry records are temporarily unavailable.</p> : null}
          {state === 'ready' && enquiries.length === 0 ? <p className="admin-empty">No enquiries have been received yet.</p> : null}
          {state === 'ready' && enquiries.length > 0 ? (
            <div className="admin-enquiry-list">
              {enquiries.map((enquiry) => (
                <article className="admin-enquiry" key={`${enquiry.createdAt}-${enquiry.email}`}>
                  <header>
                    <div>
                      <h2>{enquiry.fullName}</h2>
                      <p>{enquiry.businessName || 'No business name'}</p>
                    </div>
                    <time dateTime={enquiry.createdAt}>{new Date(enquiry.createdAt).toLocaleString('en-ZA')}</time>
                  </header>
                  <dl>
                    <div><dt>Service</dt><dd>{enquiry.service}</dd></div>
                    <div><dt>Email</dt><dd><a href={`mailto:${enquiry.email}`}>{enquiry.email}</a></dd></div>
                    <div><dt>Phone</dt><dd><a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a></dd></div>
                    <div><dt>Location</dt><dd>{enquiry.location || 'Not supplied'}</dd></div>
                  </dl>
                  <p className="admin-enquiry__message">{enquiry.message}</p>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}
