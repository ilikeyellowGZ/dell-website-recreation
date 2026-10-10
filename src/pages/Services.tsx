import { ArrowRight } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { ButtonLink } from '../components/ButtonLink'
import { ResponsiveImage } from '../components/ResponsiveImage'
import { pageImages, type ResponsiveImageAsset } from '../imageAssets'
import '../styles/services.css'

const services = [
  {
    title: 'Hardware Support',
    description: 'Repairs, maintenance and upgrades.',
    alt: 'A technician repairing computer hardware inside a server rack',
  },
  {
    title: 'Software Solutions',
    description: 'Development, testing and business applications.',
    alt: 'Code displayed on a development workstation',
  },
  {
    title: 'Networking Services',
    description: 'Reliable business networks and connectivity.',
    alt: 'Network rack with connected blue cables',
  },
  {
    title: 'PC & Desktop Support',
    description: 'Setup, troubleshooting and ongoing assistance.',
    alt: 'Desktop computers in an office workstation setup',
  },
  {
    title: 'Microsoft 365 Support',
    description: 'Accounts, email and productivity tools.',
    alt: 'Microsoft 365 productivity application icons',
  },
  {
    title: 'CCTV & Security',
    description: 'Camera installation and security system setup.',
    alt: 'CCTV security camera mounted indoors',
  },
  {
    title: 'Printer Services',
    description: 'Installation, troubleshooting and repairs.',
    alt: 'Office printer in a business workspace',
  },
  {
    title: 'Website Development',
    description: 'Responsive websites for your business.',
    alt: 'Monitor displaying a Gauvis Tech business website',
  },
] as const

type ServiceCatalogueCardProps = (typeof services)[number] & { image: ResponsiveImageAsset }

function ServiceCatalogueCard({ title, description, image, alt }: ServiceCatalogueCardProps) {
  return (
    <article className="service-catalogue-card">
      <div className="service-catalogue-card__image">
        <ResponsiveImage alt={alt} image={image} sizes="(max-width: 48rem) 100vw, (max-width: 100rem) 50vw, 33vw" />
      </div>
      <div className="service-catalogue-card__body">
        <span className="service-catalogue-card__accent" aria-hidden="true" />
        <div className="service-catalogue-card__copy">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <Link className="service-catalogue-card__link" to="/contact#request-quote" aria-label={`Enquire about ${title}`}>
          <span>Enquire about this service</span>
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
          {services.map((service, index) => (
            <ServiceCatalogueCard image={pageImages.services.cards[index]} key={service.title} {...service} />
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
