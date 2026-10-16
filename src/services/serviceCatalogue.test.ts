import { describe, expect, it } from 'vitest'
import { getServiceBySlug, serviceCatalogue, serviceHref } from './serviceCatalogue'

const expectedSlugs = [
  'hardware-support',
  'software-solutions',
  'networking-services',
  'pc-desktop-support',
  'microsoft-365-support',
  'cctv-security',
  'printer-services',
  'website-development',
] as const

describe('serviceCatalogue', () => {
  it('contains the eight approved services once and in catalogue order', () => {
    expect(serviceCatalogue.map(({ slug }) => slug)).toEqual(expectedSlugs)
    expect(new Set(serviceCatalogue.map(({ slug }) => slug)).size).toBe(serviceCatalogue.length)
  })

  it('provides complete, internally valid detail-page content', () => {
    const knownSlugs = new Set(expectedSlugs)
    for (const [index, service] of serviceCatalogue.entries()) {
      expect(service.imageIndex).toBe(index)
      for (const value of [service.title, service.homeTitle, service.summary, service.alt, service.metaTitle, service.heroLead]) {
        expect(value.trim()).not.toBe('')
      }
      expect(service.overview).toHaveLength(2)
      expect(service.overview.every((paragraph) => paragraph.trim().length > 0)).toBe(true)
      expect(service.capabilities.length).toBeGreaterThanOrEqual(4)
      expect(service.capabilities.every((capability) => capability.trim().length > 0)).toBe(true)
      expect(service.benefits.length).toBeGreaterThanOrEqual(3)
      expect(service.benefits.every(({ title, description }) => title.trim().length > 0 && description.trim().length > 0)).toBe(true)
      expect(service.process).toHaveLength(3)
      expect(service.process.map(({ title }) => title)).toEqual(['Assess', 'Deliver', 'Support'])
      expect(service.process.every(({ description }) => description.trim().length > 0)).toBe(true)
      expect(service.relatedSlugs.length).toBeGreaterThanOrEqual(2)
      expect(service.relatedSlugs).not.toContain(service.slug)
      expect(service.relatedSlugs.every((slug) => knownSlugs.has(slug))).toBe(true)
      expect(serviceHref(service.slug)).toBe(`/services/${service.slug}`)
    }
  })

  it('returns a service only for a supported slug', () => {
    expect(getServiceBySlug('hardware-support')?.title).toBe('Hardware Support')
    expect(getServiceBySlug('not-a-service')).toBeUndefined()
    expect(getServiceBySlug(undefined)).toBeUndefined()
  })
})
