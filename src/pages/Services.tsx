import { ArrowRight } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { ButtonLink } from '../components/ButtonLink'
import { ResponsiveImage } from '../components/ResponsiveImage'
import { pageImages } from '../imageAssets'
import { serviceCatalogue, serviceHref, type ServiceRecord } from '../services/serviceCatalogue'
import '../styles/services.css'

function ServiceCatalogueCard({ service }: { service: ServiceRecord }) {
  return (
    <article className="service-catalogue-card">
      <div className="service-catalogue-card__image">
        <ResponsiveImage alt={service.alt} image={pageImages.services.cards[service.imageIndex]} sizes="(max-width: 48rem) 100vw, (max-width: 100rem) 50vw, 33vw" />
      </div>
      <div className="service-catalogue-card__body">
        <span className="service-catalogue-card__accent" aria-hidden="true" />
        <div className="service-catalogue-card__copy">
          <h2>{service.title}</h2>
          <p>{service.summary}</p>
        </div>
        <Link className="service-catalogue-card__link" to={serviceHref(service.slug)}>
          <span>Explore {service.title}</span>
          <ArrowRight aria-hidden="true" size={15} weight="bold" />
        </Link>
      </div>
    </article>
  )
}

export function Services() {
  return (
    <main id="main-content">
      <section className="services-hero" aria-labelledby="services-hero-title">
        <div className="site-shell services-hero__inner">
          <div className="services-hero__copy">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span aria-hidden="true">/</span>
              <span>Services</span>
            </nav>
            <h1 id="services-hero-title" tabIndex={-1}>
              IT Services for <span>Every Business Need.</span>
            </h1>
            <p>From everyday support to complete technology setups, find the right service for your business.</p>
          </div>
          <div className="services-hero__media">
            <ResponsiveImage
              alt="Network rack with orange and blue cables"
              eager
              image={pageImages.services.hero}
              sizes="(max-width: 48rem) 100vw, 55vw"
            />
          </div>
          <span className="services-hero__accent" aria-hidden="true" />
        </div>
      </section>

      <section className="service-catalogue" aria-label="IT service catalogue">
        <div className="site-shell service-catalogue__grid">
          {serviceCatalogue.map((service) => (
            <ServiceCatalogueCard key={service.slug} service={service} />
          ))}
        </div>
      </section>

      <section className="services-cta" aria-labelledby="services-cta-title">
        <div className="site-shell services-cta__inner">
          <div>
            <h2 id="services-cta-title">
              <span>Not sure</span> where to start?
            </h2>
            <p>Talk to our team and we’ll help you find the right IT services for your business.</p>
          </div>
          <ButtonLink href="/contact#request-quote">Talk to Us</ButtonLink>
        </div>
      </section>
    </main>
  )
}
