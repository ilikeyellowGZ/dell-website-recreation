import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ResponsiveImage } from './ResponsiveImage'

const image = {
  height: 1024,
  src: '/generated/about/01-about-hero-1536.webp',
  srcSet:
    '/generated/about/01-about-hero-480.webp 480w, /generated/about/01-about-hero-768.webp 768w, /generated/about/01-about-hero-1024.webp 1024w, /generated/about/01-about-hero-1536.webp 1536w',
  width: 1536,
}

describe('ResponsiveImage', () => {
  it('renders intrinsic dimensions and a responsive source set', () => {
    render(<ResponsiveImage alt="A Gauvis technician working in a server room" image={image} sizes="50vw" />)

    const element = screen.getByRole('img', { name: /gauvis technician/i })
    expect(element).toHaveAttribute('srcset', image.srcSet)
    expect(element).toHaveAttribute('sizes', '50vw')
    expect(element).toHaveAttribute('width', '1536')
    expect(element).toHaveAttribute('height', '1024')
    expect(element).toHaveAttribute('loading', 'lazy')
  })

  it('marks a hero image as eager and high priority', () => {
    render(<ResponsiveImage alt="Server room" eager image={image} sizes="100vw" />)

    const element = screen.getByRole('img', { name: 'Server room' })
    expect(element).toHaveAttribute('loading', 'eager')
    expect(element).toHaveAttribute('fetchpriority', 'high')
  })
})
