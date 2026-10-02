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

  it('uses a confirmed phone destination for quote calls to action', () => {
    renderRoute('/about')

    const quoteLinks = screen.getAllByRole('link', { name: /request a quote/i })
    expect(quoteLinks.length).toBeGreaterThan(0)
    for (const link of quoteLinks) {
      expect(link).toHaveAttribute('href', 'tel:0840356925')
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
  })
})
