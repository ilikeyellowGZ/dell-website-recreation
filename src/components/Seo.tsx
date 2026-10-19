import { useEffect } from 'react'

const siteUrl = 'https://gauvistech.com'

type SeoProps = {
  description: string
  noindex?: boolean
  path: string
  serviceName?: string
  title: string
}

function setMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    document.head.append(element)
  }
  Object.entries(attributes).forEach(([name, value]) => element!.setAttribute(name, value))
}

export function Seo({ description, noindex = false, path, serviceName, title }: SeoProps) {
  useEffect(() => {
    const canonicalUrl = new URL(path, siteUrl).toString()
    document.title = title
    setMeta('meta[name="description"]', { name: 'description', content: description })
    setMeta('meta[name="robots"]', { name: 'robots', content: noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large' })
    setMeta('meta[property="og:title"]', { property: 'og:title', content: title })
    setMeta('meta[property="og:description"]', { property: 'og:description', content: description })
    setMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
    setMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })
    setMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: 'GuavisTech' })
    setMeta('meta[property="og:image"]', { property: 'og:image', content: `${siteUrl}/project/gvt-logo.png` })
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title })
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description })
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: `${siteUrl}/project/gvt-logo.png` })

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.append(canonical)
    }
    canonical.href = canonicalUrl

    const graph = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization', '@id': `${siteUrl}/#organization`, name: 'Gauvis Technology Holdings', alternateName: 'GuavisTech',
          url: siteUrl, logo: `${siteUrl}/project/gvt-logo.png`, email: 'info@gauvistech.com',
          telephone: ['+27840356925', '+27643670274'], areaServed: { '@type': 'Country', name: 'South Africa' },
        },
        { '@type': 'WebSite', '@id': `${siteUrl}/#website`, name: 'GuavisTech', url: siteUrl, publisher: { '@id': `${siteUrl}/#organization` } },
        serviceName
          ? { '@type': 'Service', name: serviceName, description, url: canonicalUrl, provider: { '@id': `${siteUrl}/#organization` }, areaServed: { '@type': 'Country', name: 'South Africa' } }
          : { '@type': 'WebPage', name: title, description, url: canonicalUrl, isPartOf: { '@id': `${siteUrl}/#website` } },
        ...(path === '/' ? [] : [{ '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: serviceName || title.split('|')[0].trim(), item: canonicalUrl },
        ] }]),
      ],
    }
    let jsonLd = document.head.querySelector<HTMLScriptElement>('script[data-guavis-seo]')
    if (!jsonLd) {
      jsonLd = document.createElement('script')
      jsonLd.type = 'application/ld+json'
      jsonLd.dataset.guavisSeo = 'true'
      document.head.append(jsonLd)
    }
    jsonLd.textContent = JSON.stringify(graph).replace(/</g, '\\u003c')
  }, [description, noindex, path, serviceName, title])

  return null
}
