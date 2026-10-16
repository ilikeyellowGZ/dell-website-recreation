import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminEnquiries } from './AdminEnquiries'

const enquiries = [
  {
    businessName: 'Ndlovu Trading', createdAt: '2026-10-16T08:00:00.000Z', email: 'thandi@example.com',
    fullName: 'Thandi Ndlovu', location: 'Cape Town', message: 'Three office computers need replacement.',
    phone: '+27 84 123 4567', service: 'Hardware Support', status: 'new',
  },
  {
    businessName: 'Moyo Studio', createdAt: '2026-10-15T08:00:00.000Z', email: 'moyo@example.com',
    fullName: 'Ayo Moyo', location: 'Windhoek', message: 'Our team needs Microsoft 365 migration.',
    phone: '+27 84 222 2222', service: 'Microsoft 365 Support', status: 'new',
  },
]

afterEach(() => vi.unstubAllGlobals())

async function showDashboard() {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/api/admin/session')) return { ok: true }
    if (url.endsWith('/api/admin/enquiries')) return { ok: true, json: async () => ({ enquiries }) }
    throw new Error(`Unexpected URL: ${url}`)
  }))
  render(<MemoryRouter><AdminEnquiries /></MemoryRouter>)
  await screen.findByRole('table', { name: /enquiries/i })
}

describe('admin dashboard', () => {
  it('shows a record snapshot and searchable enquiry table with full details', async () => {
    await showDashboard()
    expect(screen.getByRole('heading', { name: /enquiries dashboard/i })).toBeInTheDocument()
    expect(within(screen.getByText('Latest enquiries').parentElement!).getByText('2')).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /thandi ndlovu/i })).toBeInTheDocument()

    fireEvent.change(screen.getByRole('searchbox', { name: /search enquiries/i }), {
      target: { value: 'migration' },
    })
    expect(screen.queryByRole('row', { name: /thandi ndlovu/i })).not.toBeInTheDocument()
    expect(screen.getByRole('row', { name: /ayo moyo/i })).toBeInTheDocument()
    fireEvent.click(within(screen.getByRole('row', { name: /ayo moyo/i })).getByRole('button', { name: /view/i }))
    expect(screen.getByText('Our team needs Microsoft 365 migration.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'moyo@example.com' })).toHaveAttribute('href', 'mailto:moyo@example.com')
  })

  it('filters by service, sorts by name, and groups into labelled tables', async () => {
    await showDashboard()
    fireEvent.change(screen.getByRole('combobox', { name: /sort by/i }), { target: { value: 'name-asc' } })
    const table = screen.getByRole('table', { name: /enquiries/i })
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Ayo Moyo')

    fireEvent.change(screen.getByRole('combobox', { name: /group by/i }), { target: { value: 'service' } })
    expect(screen.getByRole('table', { name: 'Hardware Support enquiries' })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Microsoft 365 Support enquiries' })).toBeInTheDocument()

    fireEvent.change(screen.getByRole('combobox', { name: /service filter/i }), {
      target: { value: 'Hardware Support' },
    })
    await waitFor(() => expect(screen.getAllByRole('table')).toHaveLength(1))
    expect(screen.getByText(/showing 1 of 2/i)).toBeInTheDocument()
  })
})
