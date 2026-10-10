import {
  ArrowRight,
  ChatCircle,
  FileText,
  GearSix,
  Headset,
  Lifebuoy,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { ButtonLink } from '../components/ButtonLink'
import { ResponsiveImage } from '../components/ResponsiveImage'
import { pageImages } from '../imageAssets'
import '../styles/about.css'

const expectations = [
  {
    title: 'Clear advice',
    description: 'Straightforward guidance to help you make the right technology decisions for your business.',
    Icon: ChatCircle,
  },
  {
    title: 'Practical solutions',
    description: 'Tailored hardware, software and network solutions that fit your needs and budget.',
    Icon: GearSix,
  },
  {
    title: 'Dependable support',
    description: 'Responsive support to keep your systems running smoothly and your business productive.',
    Icon: Headset,
  },
]

const process = [
  {
    title: 'Assess',
    description: 'We understand your business needs and environment.',
    Icon: MagnifyingGlass,
  },
  {
    title: 'Plan',
    description: 'We design the right solution for your business.',
    Icon: FileText,
  },
  {
    title: 'Implement',
    description: 'We deploy and configure your systems.',
    Icon: GearSix,
  },
  {
    title: 'Support',
    description: 'We keep your business running smoothly.',
    Icon: Lifebuoy,
  },
]

export function About() {
  return (
    <main id="main-content">
      <section className="about-hero" aria-labelledby="about-hero-title">
        <div className="site-shell about-hero__inner">
          <div className="about-hero__copy">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span aria-hidden="true">/</span>
              <span>About</span>
            </nav>
            <p className="section-kicker">About Gauvis</p>
            <h1 id="about-hero-title" tabIndex={-1}>
              Your Technology Partner.{' '}
              <span>Built Around Your Business.</span>
            </h1>
            <p className="about-hero__lead">
              Practical IT solutions that help your business stay connected, secure and productive.
            </p>
            <ButtonLink href="/contact#request-quote" showArrow>
              Request a Quote
            </ButtonLink>
          </div>
          <ResponsiveImage
            alt="A technician working with network equipment in a server room"
            className="about-hero__photo"
            eager
            image={pageImages.about.hero}
            sizes="(max-width: 48rem) 100vw, 57vw"
          />
        </div>
      </section>

      <section className="story" aria-labelledby="story-title">
        <div className="site-shell story__inner">
          <div className="story__copy">
            <p className="section-kicker">Our Story</p>
            <h2 id="story-title">
              <span>Technology that</span>
              {' '}
              <span>works for you</span>
            </h2>
            <p>
              Gauvis Technology Holdings provides practical technology solutions across hardware, software, networks
              and support. We help businesses create reliable, secure and efficient IT environments, tailored to their
              unique needs.
            </p>
            <p>
              Our focus is on building long-term partnerships and providing the right solutions to keep your business
              connected, secure and productive.
            </p>
          </div>
          <ResponsiveImage
            alt="A technology specialist guiding a colleague at a workstation"
            className="story__photo"
            image={pageImages.about.story}
            sizes="(max-width: 48rem) 100vw, 52vw"
          />
        </div>
      </section>

      <section className="expectations" aria-labelledby="expectations-title">
        <div className="site-shell">
          <p className="section-kicker">What You Can Expect</p>
          <h2 id="expectations-title">A partner focused on your success.</h2>
          <div className="expectations-grid">
            {expectations.map(({ title, description, Icon }) => (
              <article className="expectation-item" key={title}>
                <Icon aria-hidden="true" className="expectation-item__icon" size={52} weight="regular" />
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-process" aria-labelledby="about-process-title">
        <div className="site-shell">
          <p className="section-kicker">How We Work</p>
          <h2 id="about-process-title">A simple, structured approach.</h2>
          <p className="about-process__lead">
            We follow a clear process to understand your needs and deliver the right IT solutions.
          </p>
          <div className="about-process-grid">
            {process.map(({ title, description, Icon }, index) => (
              <article className="about-process-step" key={title}>
                <div className="about-process-step__icon">
                  <Icon aria-hidden="true" size={30} weight="bold" />
                </div>
                <div className="about-process-step__copy">
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                {index < process.length - 1 ? (
                  <ArrowRight aria-hidden="true" className="about-process-step__arrow" size={24} weight="bold" />
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="nationwide" aria-labelledby="nationwide-title">
        <div className="site-shell nationwide__inner">
          <div className="nationwide__copy">
            <p className="section-kicker">Nationwide Support</p>
            <h2 id="nationwide-title">
              <span>Supporting businesses</span>
              {' '}
              <span>across South Africa.</span>
            </h2>
            <p>
              We work with businesses across South Africa, providing on-site and remote IT support. Whether you need
              new hardware, network upgrades, software solutions or ongoing maintenance, our team is ready to help.
            </p>
            <ButtonLink href="tel:0840356925" showArrow>
              On-Site Support
            </ButtonLink>
          </div>
          <ResponsiveImage
            alt="A field technician arriving to provide on-site technology support"
            className="nationwide__photo"
            image={pageImages.about.onsite}
            sizes="(max-width: 48rem) 100vw, 51vw"
          />
        </div>
      </section>

      <section className="about-cta" aria-labelledby="about-cta-title">
        <div className="site-shell about-cta__inner">
          <div>
            <h2 id="about-cta-title">
              Let&apos;s talk about <span>your IT needs.</span>
            </h2>
            <p>Get in touch for a no-obligation discussion with our team.</p>
          </div>
          <ButtonLink href="/contact#request-quote" showArrow>
            Request a Quote
          </ButtonLink>
        </div>
      </section>
    </main>
  )
}
