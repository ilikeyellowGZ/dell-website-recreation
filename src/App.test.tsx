import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

afterEach(() => {
  vi.unstubAllGlobals()
})

async function renderRoute(route: string) {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>,
    )
  })
  await waitFor(() => expect(screen.queryByText('Loading page…')).not.toBeInTheDocument(), { timeout: 10_000 })
}

describe('Shared footer', () => {
  it('shows the confirmed CIPC registration number', async () => {
    await renderRoute('/')

    expect(screen.getByText('CIPC Registration Number: 2026/703930/07')).toBeInTheDocument()
  })
})

describe('About route', () => {
  it('renders the approved About content and active navigation state', async () => {
    await renderRoute('/about')

    expect(
      screen.getByRole('heading', { level: 1, name: /your technology partner\. built around your business\./i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /technology that works for you/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /a partner focused on your success/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /a simple, structured approach/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /supporting businesses across south africa/i })).toBeInTheDocument()
    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(primaryNavigation).getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page')
    expect(within(primaryNavigation).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(document.querySelector('a[href^="mailto:"]')).not.toBeInTheDocument()
  })

  it('opens the mobile drawer, traps focus, and restores focus when it closes', async () => {
    await renderRoute('/about')

    const toggle = screen.getByRole('button', { name: 'Open menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true')

    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(primaryNavigation).getByRole('img', { name: 'GVT Gauvis Tech' })).toHaveAttribute(
      'src',
      '/project/gvt-logo.webp',
    )
    const drawerClose = within(primaryNavigation).getByRole('button', { name: 'Close navigation menu' })
    const drawerQuote = within(primaryNavigation).getByRole('link', { name: 'Request a Quote' })

    drawerQuote.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(drawerClose).toHaveFocus()

    fireEvent.click(drawerClose)
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()

    fireEvent.click(toggle)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('routes quote calls to action to the Contact form', async () => {
    await renderRoute('/about')

    const quoteLinks = screen.getAllByRole('link', { name: /request a quote/i })
    expect(quoteLinks.length).toBeGreaterThan(0)
    for (const link of quoteLinks) {
      expect(link).toHaveAttribute('href', '/contact#request-quote')
    }
  })
})

describe('Homepage route', () => {
  it('moves focus to the destination heading after client-side navigation', async () => {
    await renderRoute('/')

    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary' })
    fireEvent.click(within(primaryNavigation).getByRole('link', { name: 'About' }))

    const aboutHeading = await screen.findByRole('heading', {
      level: 1,
      name: /your technology partner\. built around your business\./i,
    })
    await waitFor(() => expect(aboutHeading).toHaveFocus())
  })

  it('keeps the homepage at the root and links About to the React route', async () => {
    await renderRoute('/')

    const title = screen.getByRole('heading', { level: 1, name: /powering your/i })
    expect(within(title).getByText(/digital future/i)).toBeInTheDocument()
    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(primaryNavigation).getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
    expect(within(primaryNavigation).getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(within(primaryNavigation).getByRole('link', { name: 'Services' })).toHaveAttribute('href', '/services')
  })
})

describe('Removed routes', () => {
  it('does not expose Case Studies in shared navigation or at its former route', async () => {
    await renderRoute('/case-studies')

    expect(screen.getByRole('heading', { level: 1, name: /powering your digital future/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1, name: /practical solutions\. projects in focus\./i })).not.toBeInTheDocument()

    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(primaryNavigation).queryByRole('link', { name: 'Case Studies' })).not.toBeInTheDocument()
    expect(within(screen.getByRole('contentinfo')).queryByRole('link', { name: 'Case Studies' })).not.toBeInTheDocument()
  })
})

describe('Services route', () => {
  it('renders the approved Services catalogue, links enquiries to Contact, and marks Services active', async () => {
    await renderRoute('/services')

    expect(screen.getByRole('heading', { level: 1, name: /it services for every business need/i })).toBeInTheDocument()
    expect(screen.getByText(/from everyday support to complete technology setups/i)).toBeInTheDocument()

    const expectedServices = [
      'Hardware Support',
      'Software Solutions',
      'Networking Services',
      'PC & Desktop Support',
      'Microsoft 365 Support',
      'CCTV & Security',
      'Printer Services',
      'Website Development',
    ]

    for (const service of expectedServices) {
      expect(screen.getByRole('heading', { name: service })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: `Enquire about ${service}` })).toHaveAttribute(
        'href',
        '/contact#request-quote',
      )
    }

    expect(screen.getByRole('link', { name: 'Talk to Us' })).toHaveAttribute('href', '/contact#request-quote')
    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(primaryNavigation).getByRole('link', { name: 'Services' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(primaryNavigation).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
  })
})

describe('Solutions route', () => {
  it('renders the project-owned business-need solutions and marks Solutions active', async () => {
    await renderRoute('/solutions')

    expect(
      screen.getByRole('heading', { level: 1, name: /technology solutions built around your business/i }),
    ).toBeInTheDocument()

    const solutionTitles = [
      'For small businesses',
      'For growing businesses',
      'For businesses with IT issues',
      'For businesses moving to cloud',
      'For businesses needing better security',
      'For businesses needing a stronger digital presence',
    ]

    for (const title of solutionTitles) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    }

    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(primaryNavigation).getByRole('link', { name: 'Solutions' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    for (const service of ['Hardware Support', 'Networking Services', 'IT Support', 'Website Development']) {
      expect(screen.getAllByRole('link', { name: service }).some((link) => link.getAttribute('href') === '/services')).toBe(true)
    }
    expect(screen.getByRole('link', { name: /talk to gauvis/i })).toHaveAttribute('href', '/contact#request-quote')
  })

  it('does not present unapproved legal documents as website destinations', async () => {
    await renderRoute('/solutions')

    expect(screen.queryByText('Privacy Policy')).not.toBeInTheDocument()
    expect(screen.queryByText('Terms & Conditions')).not.toBeInTheDocument()
  })
})

describe('FAQ route', () => {
  it('renders approved FAQs, filters by search and category, and marks FAQ active', async () => {
    await renderRoute('/faq')

    expect(screen.getByRole('heading', { level: 1, name: /clear answers\. confident decisions\./i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'General questions' })).toBeInTheDocument()

    const firstQuestion = screen.getByRole('button', { name: 'What services do you offer?' })
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/we assist with hardware repairs/i)).toBeInTheDocument()

    const expectedQuestions = [
      'What services do you offer?',
      'Do you provide on-site support?',
      'Can you help my small business?',
      'How do I request a quote?',
      'Can I combine multiple services?',
      'What information should I provide when enquiring?',
    ]

    for (const question of expectedQuestions) {
      expect(screen.getByRole('button', { name: question })).toBeInTheDocument()
    }

    fireEvent.click(screen.getByRole('button', { name: 'Quotes' }))
    expect(screen.getByRole('button', { name: 'Quotes' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: 'Quotes questions' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'How do I request a quote?' })).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Search questions...'), { target: { value: 'printer' } })
    expect(screen.getByRole('button', { name: 'What services do you offer?' })).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Search questions...'), { target: { value: 'zzzz' } })
    expect(screen.getByText('No questions match your search.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(screen.getByRole('button', { name: 'How do I request a quote?' })).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Contact Us' })).toHaveAttribute('href', '/contact')
    expect(screen.getByRole('link', { name: 'WhatsApp Us' })).toHaveAttribute(
      'href',
      'https://wa.me/27840356925',
    )
    const quoteLinks = screen.getAllByRole('link', { name: 'Request a Quote' })
    expect(quoteLinks.some((link) => link.getAttribute('href') === '/contact#request-quote')).toBe(true)

    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(primaryNavigation).getByRole('link', { name: 'FAQ' })).toHaveAttribute('aria-current', 'page')
  })

  it('toggles FAQ answers with an accessible accordion button', async () => {
    await renderRoute('/faq')

    const supportQuestion = screen.getByRole('button', { name: 'Do you provide on-site support?' })
    expect(supportQuestion).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(supportQuestion)
    expect(supportQuestion).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/gauvis tech provides on-site assistance/i)).toBeInTheDocument()
  })
})

describe('Contact route', () => {
  it('renders the approved Contact content, destinations, and active navigation state', async () => {
    await renderRoute('/contact')

    expect(screen.getByRole('heading', { level: 1, name: /let’s talk about your it needs/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /get in touch/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /request a quote/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /what happens next/i })).toBeInTheDocument()

    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(primaryNavigation).getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(primaryNavigation).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /thabang 084 035 6925/i })).toHaveAttribute(
      'href',
      'tel:+27840356925',
    )
    expect(screen.getByRole('link', { name: /pontsho 064 367 0274/i })).toHaveAttribute(
      'href',
      'tel:+27643670274',
    )
    expect(screen.getByRole('link', { name: /chat on whatsapp/i })).toHaveAttribute(
      'href',
      'https://wa.me/27840356925',
    )
    expect(document.querySelector('a[href^="mailto:"]')).not.toBeInTheDocument()
  })

  it('shows connected validation errors, focuses the first invalid field, and preserves invalid values', async () => {
    await renderRoute('/contact')

    fireEvent.click(screen.getByRole('button', { name: /send enquiry/i }))

    const nameInput = screen.getByLabelText(/full name/i)
    expect(nameInput).toHaveFocus()
    expect(screen.getByText('Enter your full name.')).toBeInTheDocument()
    expect(screen.getByText('Enter your email address.')).toBeInTheDocument()
    expect(screen.getByText('Enter your phone number.')).toBeInTheDocument()
    expect(screen.getByText('Select a service.')).toBeInTheDocument()
    expect(screen.getByText('Tell us what you need.')).toBeInTheDocument()
    expect(screen.getByText('Please agree to be contacted about your enquiry.')).toBeInTheDocument()

    fireEvent.change(nameInput, { target: { value: 'Thandi Ndlovu' } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'thandi@invalid' } })
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '123' } })
    fireEvent.click(screen.getByRole('button', { name: /send enquiry/i }))

    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid phone number.')).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toHaveValue('thandi@invalid')
    expect(screen.getByLabelText(/phone number/i)).toHaveValue('123')
  })

  it('shows a pending state and only announces success after the API accepts the enquiry', async () => {
    let acceptRequest: ((value: unknown) => void) | undefined
    const fetchPromise = new Promise((resolve) => {
      acceptRequest = resolve
    })
    vi.stubGlobal('fetch', vi.fn(() => fetchPromise))
    await renderRoute('/contact')

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Thandi Ndlovu' } })
    fireEvent.change(screen.getByLabelText(/business name/i), { target: { value: 'Ndlovu Trading' } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'thandi@example.com' } })
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '+27 84 123 4567' } })
    fireEvent.change(screen.getByLabelText(/service required/i), { target: { value: 'Hardware Support' } })
    fireEvent.change(screen.getByLabelText(/^location/i), { target: { value: 'Cape Town' } })
    fireEvent.change(screen.getByLabelText(/tell us what you need/i), {
      target: { value: 'Please help us replace three office computers.' },
    })
    fireEvent.click(screen.getByLabelText(/i agree to be contacted/i))
    fireEvent.click(screen.getByRole('button', { name: /send enquiry/i }))

    expect(screen.getByRole('button', { name: /sending enquiry/i })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(/sending your enquiry/i)

    await act(async () => {
      acceptRequest?.({
        ok: true,
        status: 201,
        json: async () => ({ accepted: true }),
      })
      await fetchPromise
    })

    expect(await screen.findByRole('status')).toHaveTextContent(/your enquiry has been received/i)
    expect(screen.getByRole('button', { name: /send enquiry/i })).toBeEnabled()
    expect(screen.getByLabelText(/full name/i)).toHaveValue('')
    expect(screen.getByLabelText(/email address/i)).toHaveValue('')
  })

  it('keeps entered values and allows retrying when the API is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({
          accepted: false,
          code: 'SERVICE_UNAVAILABLE',
          message: 'Enquiry delivery is temporarily unavailable. Please try again or contact us by phone.',
        }),
      }),
    )
    await renderRoute('/contact')

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Thandi Ndlovu' } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'thandi@example.com' } })
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '+27 84 123 4567' } })
    fireEvent.change(screen.getByLabelText(/service required/i), { target: { value: 'Hardware Support' } })
    fireEvent.change(screen.getByLabelText(/tell us what you need/i), {
      target: { value: 'Please help us replace three office computers.' },
    })
    fireEvent.click(screen.getByLabelText(/i agree to be contacted/i))
    fireEvent.click(screen.getByRole('button', { name: /send enquiry/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/temporarily unavailable/i)
    })
    expect(screen.getByLabelText(/full name/i)).toHaveValue('Thandi Ndlovu')
    expect(screen.getByLabelText(/email address/i)).toHaveValue('thandi@example.com')
    expect(screen.getByLabelText(/tell us what you need/i)).toHaveValue(
      'Please help us replace three office computers.',
    )
    expect(screen.getByRole('button', { name: /send enquiry/i })).toBeEnabled()
  })

  it('connects API validation errors to fields without clearing the form', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          accepted: false,
          code: 'VALIDATION_ERROR',
          fieldErrors: { email: 'Enter a valid email address.' },
        }),
      }),
    )
    await renderRoute('/contact')

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Thandi Ndlovu' } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'thandi@example.com' } })
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '+27 84 123 4567' } })
    fireEvent.change(screen.getByLabelText(/service required/i), { target: { value: 'Hardware Support' } })
    fireEvent.change(screen.getByLabelText(/tell us what you need/i), { target: { value: 'Help with hardware.' } })
    fireEvent.click(screen.getByLabelText(/i agree to be contacted/i))
    fireEvent.click(screen.getByRole('button', { name: /send enquiry/i }))

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText(/email address/i)).toHaveValue('thandi@example.com')
  })
})

describe('Admin routes', () => {
  it('renders a dedicated admin sign-in screen', async () => {
    await renderRoute('/admin/login')

    expect(screen.getByRole('heading', { level: 1, name: /admin sign in/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })
})
