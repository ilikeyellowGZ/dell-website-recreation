import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { QuoteForm } from './QuoteForm'

describe('QuoteForm', () => {
  it('keeps the contact form interactive without a build-time enquiry flag', () => {
    render(<QuoteForm />)

    expect(screen.getByRole('button', { name: /send enquiry/i })).toBeEnabled()
    expect(screen.queryByText(/online enquiries are not open yet/i)).not.toBeInTheDocument()
  })
})
