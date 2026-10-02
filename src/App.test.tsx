import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { App } from './App'

function renderRoute(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  )
}

describe('About route', () => {
  it('renders the approved About content and active navigation state', () => {
    renderRoute('/about')

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

  it('opens and closes the accessible mobile navigation disclosure', () => {
    renderRoute('/about')

    const toggle = screen.getByRole('button', { name: 'Open menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('routes quote calls to action to the Contact form', () => {
    renderRoute('/about')

    const quoteLinks = screen.getAllByRole('link', { name: /request a quote/i })
    expect(quoteLinks.length).toBeGreaterThan(0)
    for (const link of quoteLinks) {
      expect(link).toHaveAttribute('href', '/contact#request-quote')
    }
  })
})

describe('Homepage route', () => {
  it('keeps the homepage at the root and links About to the React route', () => {
    renderRoute('/')

    const title = screen.getByRole('heading', { level: 1, name: /powering your/i })
    expect(within(title).getByText(/digital future/i)).toBeInTheDocument()
    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(primaryNavigation).getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
    expect(within(primaryNavigation).getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(within(primaryNavigation).getByRole('link', { name: 'Services' })).toHaveAttribute('href', '/services')
  })
})

describe('Services route', () => {
  it('renders the approved Services catalogue, links enquiries to Contact, and marks Services active', () => {
    renderRoute('/services')

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

describe('Case Studies route', () => {
  it('renders approved illustrative projects, filters them, opens scope details, and marks Case Studies active', () => {
    renderRoute('/case-studies')

    expect(screen.getByRole('heading', { level: 1, name: /practical solutions\. projects in focus\./i })).toBeInTheDocument()
    expect(screen.getByText('Illustrative project examples.')).toBeInTheDocument()
    expect(screen.getAllByText('ILLUSTRATIVE EXAMPLE')).toHaveLength(4)

    const expectedProjects = [
      'Office Network Setup',
      'Business CCTV Installation',
      'Business Website Design',
      'Workstation & Microsoft 365 Setup',
    ]

    for (const project of expectedProjects) {
      expect(screen.getByRole('heading', { name: project })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: `Explore project scope for ${project}` })).toBeInTheDocument()
    }

    fireEvent.click(screen.getByRole('button', { name: 'Security' }))
    expect(screen.getByRole('button', { name: 'Security' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('Showing 1 illustrative project example.')
    expect(screen.getByRole('heading', { name: 'Business CCTV Installation' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Office Network Setup' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'All Projects' }))
    expect(screen.getByRole('heading', { name: 'Office Network Setup' })).toBeInTheDocument()

    const trigger = screen.getByRole('button', { name: 'Explore project scope for Office Network Setup' })
    fireEvent.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Office Network Setup' })
    expect(dialog).toHaveTextContent('Networking')
    expect(dialog).toHaveTextContent('Illustrative project examples.')
    expect(dialog).toHaveTextContent('Network layout, device connections and shared access.')
    expect(within(dialog).getByRole('link', { name: 'Discuss Your Project' })).toHaveAttribute(
      'href',
      '/contact#request-quote',
    )
    fireEvent(dialog, new Event('cancel', { bubbles: false, cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()

    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(primaryNavigation).getByRole('link', { name: 'Case Studies' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(primaryNavigation).getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/faq')
  })
})

describe('FAQ route', () => {
  it('renders approved FAQs, filters by search and category, and marks FAQ active', () => {
    renderRoute('/faq')

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
    expect(screen.getByRole('button', { name: 'WhatsApp Us' })).toBeDisabled()
    const quoteLinks = screen.getAllByRole('link', { name: 'Request a Quote' })
    expect(quoteLinks.some((link) => link.getAttribute('href') === '/contact#request-quote')).toBe(true)

    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(primaryNavigation).getByRole('link', { name: 'FAQ' })).toHaveAttribute('aria-current', 'page')
    expect(within(primaryNavigation).getByRole('link', { name: 'Case Studies' })).toHaveAttribute(
      'href',
      '/case-studies',
    )
  })

  it('toggles FAQ answers with an accessible accordion button', () => {
    renderRoute('/faq')

    const supportQuestion = screen.getByRole('button', { name: 'Do you provide on-site support?' })
    expect(supportQuestion).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(supportQuestion)
    expect(supportQuestion).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/gauvis tech provides on-site assistance/i)).toBeInTheDocument()
  })
})

describe('Contact route', () => {
  it('renders the approved Contact content, destinations, and active navigation state', () => {
    renderRoute('/contact')

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
    expect(screen.getByRole('button', { name: /chat on whatsapp/i })).toBeDisabled()
    expect(document.querySelector('a[href^="mailto:"]')).not.toBeInTheDocument()
  })

  it('shows connected validation errors, focuses the first invalid field, and preserves invalid values', () => {
    renderRoute('/contact')

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

  it('does not fake delivery when no enquiry integration is configured', () => {
    renderRoute('/contact')

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

    expect(screen.getByRole('alert')).toHaveTextContent(/online enquiry delivery is not configured/i)
    expect(screen.queryByText(/success|thank you for your enquiry/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toHaveValue('Thandi Ndlovu')
    expect(screen.getByLabelText(/email address/i)).toHaveValue('thandi@example.com')
    expect(screen.getByLabelText(/tell us what you need/i)).toHaveValue(
      'Please help us replace three office computers.',
    )
  })
})
