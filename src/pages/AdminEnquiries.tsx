import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEnquiries, getSession, logout, recordAdminActivity, type AdminEnquiry } from '../features/admin/adminApi'
import '../styles/admin.css'

type SortOrder = 'newest' | 'oldest' | 'name-asc' | 'name-desc'
type GroupBy = 'none' | 'service' | 'location'

const dateFormatter = new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })

function EnquiryTable({ enquiries, label, onView }: {
  enquiries: AdminEnquiry[]
  label: string
  onView: (enquiry: AdminEnquiry, trigger: HTMLButtonElement) => void
}) {
  return <div className="admin-table-scroll"><table className="admin-table" aria-label={label}>
    <thead><tr>
      <th scope="col">Received</th><th scope="col">Contact</th><th scope="col">Service</th>
      <th scope="col">Location</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Details</span></th>
    </tr></thead>
    <tbody>{enquiries.map((enquiry) => <tr key={enquiry.reference || `${enquiry.createdAt}-${enquiry.email}`}>
      <td><time dateTime={enquiry.createdAt}>{dateFormatter.format(new Date(enquiry.createdAt))}</time></td>
      <td><strong>{enquiry.fullName}</strong><span>{enquiry.businessName || enquiry.email}</span></td>
      <td>{enquiry.service}</td><td>{enquiry.location || 'Not supplied'}</td>
      <td><span className="admin-status">New</span></td>
      <td><button className="admin-text-button" type="button" onClick={(event) => onView(enquiry, event.currentTarget)} aria-label={`View enquiry from ${enquiry.fullName}`}>View</button></td>
    </tr>)}</tbody>
  </table></div>
}

export function AdminEnquiries() {
  const navigate = useNavigate()
  const [enquiries, setEnquiries] = useState<AdminEnquiry[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [search, setSearch] = useState('')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [selected, setSelected] = useState<AdminEnquiry | null>(null)
  const [reload, setReload] = useState(0)
  const [snapshotTime, setSnapshotTime] = useState(0)
  const detailRef = useRef<HTMLElement>(null)
  const lastViewTriggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!selected || !detailRef.current) return
    detailRef.current.focus({ preventScroll: true })
    detailRef.current.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    })
  }, [selected])

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        if (!(await getSession())) { navigate('/admin/login', { replace: true }); return }
        const records = await getEnquiries()
        if (active) { setEnquiries(records); setSnapshotTime(Date.now()); setState('ready') }
      } catch (error) {
        if (error instanceof Error && error.message === 'AUTHENTICATION_REQUIRED') {
          navigate('/admin/login', { replace: true }); return
        }
        if (active) setState('error')
      }
    }
    void load()
    return () => { active = false }
  }, [navigate, reload])

  useEffect(() => {
    let lastSentAt = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const meaningfulActivity = () => {
      const now = Date.now()
      if (now - lastSentAt < 60_000) return
      lastSentAt = now
      clearTimeout(timer)
      timer = setTimeout(() => {
        void recordAdminActivity().then((active) => {
          if (!active) navigate('/admin/login', { replace: true })
        })
      }, 500)
    }
    const events: (keyof WindowEventMap)[] = ['click', 'keydown', 'pointerdown']
    events.forEach((event) => window.addEventListener(event, meaningfulActivity, { passive: true }))
    return () => {
      clearTimeout(timer)
      events.forEach((event) => window.removeEventListener(event, meaningfulActivity))
    }
  }, [navigate])

  const services = useMemo(() => [...new Set(enquiries.map((item) => item.service))].sort(), [enquiries])
  const locations = useMemo(() => new Set(enquiries.map((item) => item.location.trim()).filter(Boolean)).size, [enquiries])
  const recentCount = useMemo(() => enquiries.filter((item) => {
    const age = snapshotTime - new Date(item.createdAt).getTime()
    return age >= 0 && age <= 7 * 24 * 60 * 60 * 1000
  }).length, [enquiries, snapshotTime])
  const serviceCounts = useMemo(() => services.map((service) => ({
    service, count: enquiries.filter((item) => item.service === service).length,
  })), [enquiries, services])

  const visibleEnquiries = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return enquiries.filter((item) => {
      if (serviceFilter !== 'all' && item.service !== serviceFilter) return false
      return !query || [item.fullName, item.businessName, item.email, item.phone, item.service, item.location, item.message]
        .some((value) => value.toLocaleLowerCase().includes(query))
    }).sort((left, right) => {
      if (sortOrder === 'name-asc') return left.fullName.localeCompare(right.fullName)
      if (sortOrder === 'name-desc') return right.fullName.localeCompare(left.fullName)
      const difference = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      return sortOrder === 'oldest' ? difference : -difference
    })
  }, [enquiries, search, serviceFilter, sortOrder])

  const groups = useMemo(() => {
    if (groupBy === 'none') return [['All enquiries', visibleEnquiries]] as [string, AdminEnquiry[]][]
    const grouped = new Map<string, AdminEnquiry[]>()
    for (const enquiry of visibleEnquiries) {
      const name = groupBy === 'service' ? enquiry.service : enquiry.location.trim() || 'Not supplied'
      grouped.set(name, [...(grouped.get(name) || []), enquiry])
    }
    return [...grouped].sort(([left], [right]) => left.localeCompare(right))
  }, [groupBy, visibleEnquiries])

  const handleLogout = async () => {
    try { await logout() } finally { navigate('/admin/login', { replace: true }) }
  }

  const handleView = (enquiry: AdminEnquiry, trigger: HTMLButtonElement) => {
    lastViewTriggerRef.current = trigger
    setSelected(enquiry)
  }

  const handleCloseDetails = () => {
    setSelected(null)
    requestAnimationFrame(() => lastViewTriggerRef.current?.focus())
  }

  return <main className="admin-page" id="main-content">
    <section className="admin-enquiries" aria-labelledby="admin-enquiries-title"><div className="site-shell">
      <header className="admin-enquiries__header">
        <div><p className="section-kicker">Gauvis administration</p><h1 id="admin-enquiries-title" tabIndex={-1}>Enquiries dashboard</h1><p className="admin-lead">Review and find website enquiries in one place.</p></div>
        <div className="admin-header-actions"><button className="admin-secondary-button" type="button" disabled={state === 'loading'} onClick={() => { setState('loading'); setReload((value) => value + 1) }}>Refresh</button><button className="button button--primary" onClick={handleLogout} type="button">Sign out</button></div>
      </header>
      {state === 'loading' ? <p role="status">Loading enquiries…</p> : null}
      {state === 'error' ? <div className="admin-empty" role="alert">Enquiry records are temporarily unavailable. <button className="admin-text-button" type="button" onClick={() => { setState('loading'); setReload((value) => value + 1) }}>Try again</button></div> : null}
      {state === 'ready' ? <>
        <p className="admin-scope">Snapshot of the latest {enquiries.length} enquiries returned by the API (maximum 100).</p>
        <section className="admin-stats" aria-label="Enquiry snapshot">
          <div className="admin-stat"><span className="admin-stat__label">Latest enquiries</span><strong className="admin-stat__value">{enquiries.length}</strong><span>Records in this snapshot</span></div>
          <div className="admin-stat"><span className="admin-stat__label">Last 7 days</span><strong className="admin-stat__value">{recentCount}</strong><span>Recently received</span></div>
          <div className="admin-stat"><span className="admin-stat__label">Services requested</span><strong className="admin-stat__value">{services.length}</strong><span>Distinct services</span></div>
          <div className="admin-stat"><span className="admin-stat__label">Locations supplied</span><strong className="admin-stat__value">{locations}</strong><span>Distinct locations</span></div>
        </section>
        <section className="admin-panel admin-service-section" aria-labelledby="admin-service-title">
          <div className="admin-section-heading"><div><p className="section-kicker">At a glance</p><h2 id="admin-service-title">Requests by service</h2></div><span>From the latest records</span></div>
          {serviceCounts.length ? <div className="admin-service-grid">{serviceCounts.map(({ service, count }) => <button key={service} className={`admin-service-tile${serviceFilter === service ? ' is-active' : ''}`} type="button" onClick={() => setServiceFilter(serviceFilter === service ? 'all' : service)} aria-pressed={serviceFilter === service}><span>{service}</span><strong>{count}</strong></button>)}</div> : <p>No service requests yet.</p>}
        </section>
        <section className="admin-panel admin-records" aria-labelledby="admin-records-title">
          <div className="admin-section-heading"><div><p className="section-kicker">Records</p><h2 id="admin-records-title">Find an enquiry</h2></div><span aria-live="polite">Showing {visibleEnquiries.length} of {enquiries.length}</span></div>
          <div className="admin-filters">
            <label className="admin-filter admin-filter--search">Search enquiries<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, service, message…" /></label>
            <label className="admin-filter">Service filter<select value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)}><option value="all">All services</option>{services.map((service) => <option key={service} value={service}>{service}</option>)}</select></label>
            <label className="admin-filter">Sort by<select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option></select></label>
            <label className="admin-filter">Group by<select value={groupBy} onChange={(event) => setGroupBy(event.target.value as GroupBy)}><option value="none">No grouping</option><option value="service">Service</option><option value="location">Location</option></select></label>
          </div>
          {enquiries.length === 0 ? <p className="admin-empty">No enquiries have been received yet.</p> : null}
          {enquiries.length > 0 && visibleEnquiries.length === 0 ? <div className="admin-empty">No enquiries match those filters. <button className="admin-text-button" type="button" onClick={() => { setSearch(''); setServiceFilter('all') }}>Clear filters</button></div> : null}
          {visibleEnquiries.length > 0 ? <div className="admin-groups">{groups.map(([name, records]) => <div className="admin-group" key={name}>{groupBy !== 'none' ? <h3>{name} <span>{records.length}</span></h3> : null}<EnquiryTable enquiries={records} label={`${name} enquiries`} onView={handleView} /></div>)}</div> : null}
        </section>
        {selected ? <section className="admin-panel admin-detail" aria-labelledby="admin-detail-title" ref={detailRef} tabIndex={-1}>
          <div className="admin-section-heading"><div><p className="section-kicker">Enquiry details</p><h2 id="admin-detail-title">{selected.fullName}</h2></div><button className="admin-secondary-button" type="button" onClick={handleCloseDetails}>Close details</button></div>
          <dl className="admin-detail-grid">
            <div><dt>Received</dt><dd><time dateTime={selected.createdAt}>{dateFormatter.format(new Date(selected.createdAt))}</time></dd></div>
            <div><dt>Business</dt><dd>{selected.businessName || 'Not supplied'}</dd></div>
            <div><dt>Service</dt><dd>{selected.service}</dd></div>
            <div><dt>Location</dt><dd>{selected.location || 'Not supplied'}</dd></div>
            <div><dt>Email</dt><dd><a href={`mailto:${selected.email}`}>{selected.email}</a></dd></div>
            <div><dt>Phone</dt><dd><a href={`tel:${selected.phone}`}>{selected.phone}</a></dd></div>
          </dl><h3>Message</h3><p className="admin-detail-message">{selected.message}</p>
        </section> : null}
      </> : null}
    </div></section>
  </main>
}
