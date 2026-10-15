import { ArrowRight, Check } from '@phosphor-icons/react'
import { Link, useParams } from 'react-router-dom'
import { ButtonLink } from '../components/ButtonLink'
import { ResponsiveImage } from '../components/ResponsiveImage'
import { pageImages } from '../imageAssets'
import { getServiceBySlug, serviceCatalogue, serviceHref, type ServiceRecord } from '../services/serviceCatalogue'
import '../styles/service-detail.css'

export function ServiceDetail() {
  const { serviceSlug } = useParams<{ serviceSlug: string }>()
  const service = getServiceBySlug(serviceSlug)

  if (!service) {
    return (
      <main id="main-content">
        <section className="service-detail-not-found site-shell" aria-labelledby="service-not-found-title">
          <p className="section-kicker">Our services</p>
          <h1 id="service-not-found-title" tabIndex={-1}>Service not found</h1>
          <p>We couldn’t find that service. Browse our services or tell our team what your business needs.</p>
          <div className="service-detail-actions">
            <ButtonLink href="/services">View all services</ButtonLink>
            <ButtonLink href="/contact#request-quote" variant="light">Contact our team</ButtonLink>
          </div>
        </section>
      </main>
    )
  }

  const relatedServices = service.relatedSlugs
    .map((slug) => serviceCatalogue.find((related) => related.slug === slug))
    .filter((related): related is (typeof serviceCatalogue)[number] => related !== undefined)

  return (
    <main id="main-content">
      <section className="service-detail-hero" aria-labelledby="service-detail-title">
        <div className="site-shell service-detail-hero__inner">
          <div className="service-detail-hero__copy">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link><span aria-hidden="true">/</span>
              <Link to="/services">Services</Link><span aria-hidden="true">/</span>
              <span aria-current="page">{service.title}</span>
            </nav>
            <p className="section-kicker">Business IT services</p>
            <h1 id="service-detail-title" tabIndex={-1}>{service.title}</h1>
            <p className="service-detail-hero__lead">{service.heroLead}</p>
          </div>
          <div className="service-detail-hero__media">
            <ResponsiveImage alt={service.alt} eager image={pageImages.services.cards[service.imageIndex]} sizes="(max-width: 48rem) 100vw, 50vw" />
          </div>
        </div>
      </section>

      <div className="site-shell service-detail-introduction">
        <section className="service-detail-overview" aria-labelledby="service-overview-title">
          <p className="section-kicker">Practical support</p>
          <h2 id="service-overview-title">Support built around your business</h2>
          {service.overview.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
        <section className="service-detail-capabilities" aria-labelledby="service-capabilities-title">
          <h2 id="service-capabilities-title">What we can help with</h2>
          <ul>
            {service.capabilities.map((capability) => (
              <li key={capability}><Check aria-hidden="true" size={20} weight="bold" /><span>{capability}</span></li>
            ))}
          </ul>
        </section>
      </div>

      <section className="service-detail-benefits" aria-labelledby="service-benefits-title">
        <div className="site-shell">
          <p className="section-kicker">The business benefit</p>
          <h2 id="service-benefits-title">What this means for your business</h2>
          <div className="service-detail-grid">
            {service.benefits.map((benefit) => (
              <article className="service-detail-benefit" key={benefit.title}>
                <h3>{benefit.title}</h3><p>{benefit.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="service-detail-process" aria-labelledby="service-process-title">
        <div className="site-shell">
          <p className="section-kicker">A clear next step</p>
          <h2 id="service-process-title">How we work with you</h2>
          <ol className="service-detail-grid">
            {service.process.map((step, index) => (
              <li className="service-detail-step" key={step.title}>
                <span className="service-detail-step__number" aria-hidden="true">0{index + 1}</span>
                <h3>{step.title}</h3><p>{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="service-detail-related" aria-labelledby="service-related-title">
        <div className="site-shell">
          <p className="section-kicker">Connected support</p>
          <h2 id="service-related-title">Related services</h2>
          <div className="service-detail-grid">
            {relatedServices.map((related: ServiceRecord) => (
              <article className="service-detail-related-card" key={related.slug}>
                <Link to={serviceHref(related.slug)} aria-label={`Explore ${related.title}`}>
                  <h3>{related.title}</h3><p>{related.summary}</p>
                  <span className="service-detail-related-card__action">Explore service <ArrowRight aria-hidden="true" size={18} weight="bold" /></span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="service-detail-cta" aria-labelledby="service-cta-title">
        <div className="site-shell service-detail-cta__inner">
          <div><h2 id="service-cta-title">Let’s discuss your {service.title.toLowerCase()} needs</h2>
            <p>Tell us what your business needs and we’ll help you plan the next step.</p></div>
          <ButtonLink href="/contact#request-quote" showArrow>Request a quote for {service.title}</ButtonLink>
        </div>
      </section>
    </main>
  )
}
