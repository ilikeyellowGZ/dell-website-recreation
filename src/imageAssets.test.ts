import { describe, expect, it } from 'vitest'
import { pageImages } from './imageAssets'

describe('responsive page image mappings', () => {
  it('maps every supplied service photograph to its matching service', () => {
    expect(pageImages.services.cards.map((image) => image.src)).toEqual([
      '/generated/services/02-services-hardware-1536.webp',
      '/generated/services/03-services-software-1536.webp',
      '/generated/services/04-services-networking-1536.webp',
      '/generated/services/05-services-desktop-1536.webp',
      '/generated/services/06-services-microsoft-365-1536.webp',
      '/generated/services/07-services-cctv-1536.webp',
      '/generated/services/08-services-printer-1536.webp',
      '/generated/services/09-services-website-1536.webp',
    ])
  })

  it('maps named hero and section imagery without reusing screenshot composites', () => {
    expect(pageImages.about.hero.src).toContain('01-about-hero-1536.webp')
    expect(pageImages.about.story.src).toContain('02-about-story-1536.webp')
    expect(pageImages.about.onsite.src).toContain('03-about-onsite-1536.webp')
    expect(pageImages.contact.hero.src).toContain('01-contact-hero-1536.webp')
    expect(pageImages.faq.cta.src).toContain('02-faq-cta-1536.webp')
    expect(pageImages.solutions.approach.src).toContain('02-solutions-approach-1536.webp')
  })
})
