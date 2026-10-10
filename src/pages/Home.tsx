import { Phone } from '@phosphor-icons/react'
import { gsap } from 'gsap'
import { domAnimation, LazyMotion, m, useReducedMotion } from 'motion/react'
import { useLayoutEffect, useRef } from 'react'
import { assets } from '../assets'
import { ButtonLink } from '../components/ButtonLink'
import { ResponsiveImage } from '../components/ResponsiveImage'
import { brandLogos, pageImages } from '../imageAssets'
import '../styles/home.css'

const categories = [
  ['Hardware', assets.iconHardware],
  ['Software', assets.iconSoftware],
  ['Networking', assets.iconNetworking],
  ['IT Support', assets.iconSupport],
  ['Security', assets.iconSecurity],
  ['Web Development', assets.iconWeb],
] as const

const services = [
  ['Hardware OEM', pageImages.services.cards[0], 'A technician repairing computer hardware'],
  ['Software Solutions', pageImages.services.cards[1], 'Software code displayed on a workstation'],
  ['Network Services', pageImages.services.cards[2], 'Network switches with connected blue cables'],
  ['PC & End User Support', pageImages.services.cards[3], 'Desktop computer workstations'],
  ['Microsoft 365 Support', pageImages.services.cards[4], 'Microsoft 365 application icons'],
  ['CCTV & Security', pageImages.services.cards[5], 'CCTV security camera'],
  ['Printer Services', pageImages.services.cards[6], 'Office printer'],
  ['Website Development', pageImages.services.cards[7], 'Business website displayed on a laptop'],
] as const

const process = [
  ['01', 'Assess', 'Understand your needs and environment.'],
  ['02', 'Plan', 'Design the right solution for your business.'],
  ['03', 'Implement', 'Deploy and configure your systems.'],
  ['04', 'Support', 'Keep your business running smoothly.'],
] as const

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
}

export function Home() {
  const rootRef = useRef<HTMLElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const revealProps = shouldReduceMotion ? {} : reveal

  useLayoutEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    if (reduceMotion || !rootRef.current) return

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } })
      timeline
        .from('.home-hero__eyebrow', { autoAlpha: 0, y: 12, duration: 0.42 })
        .from('.home-hero h1', { autoAlpha: 0, y: 24, duration: 0.66 }, '-=.22')
        .from('.home-hero__copy > p', { autoAlpha: 0, y: 18, duration: 0.52 }, '-=.36')
        .from('.home-hero__actions .button', { autoAlpha: 0, y: 12, duration: 0.42, stagger: 0.08 }, '-=.28')
        .from('.home-hero__media', { autoAlpha: 0, x: 30, duration: 0.78 }, '-=.72')
    }, rootRef)

    return () => context.revert()
  }, [])

  return (
    <LazyMotion features={domAnimation}>
      <main id="main-content" ref={rootRef}>
      <section className="home-hero" id="home" aria-labelledby="home-hero-title">
        <div className="site-shell home-hero__inner">
          <div className="home-hero__copy">
            <p className="home-hero__eyebrow">Gauvis Technology Holdings</p>
            <h1 id="home-hero-title" tabIndex={-1}>
              Powering Your{' '}
              <span>Digital Future.</span>
            </h1>
            <p>
              Expert IT solutions for businesses across South Africa. From infrastructure and networks to software and
              support, we keep you connected, secure and productive.
            </p>
            <div className="home-hero__actions">
              <ButtonLink href="/contact#request-quote">Request a Quote</ButtonLink>
              <ButtonLink href="#services" variant="outline">Explore Services</ButtonLink>
            </div>
          </div>
          <div className="home-hero__media" aria-hidden="true">
            <ResponsiveImage alt="" eager image={pageImages.services.hero} sizes="(max-width: 48rem) 100vw, 55vw" />
          </div>
        </div>
      </section>

      <nav className="category-strip" aria-label="Service categories">
        <div className="site-shell category-grid">
          {categories.map(([label, icon]) => (
            <a className="category-link" href="/services" key={label}>
              <img src={icon} width="88" height="76" alt="" />
              <span>{label}</span>
            </a>
          ))}
        </div>
      </nav>

      <m.section className="home-about" aria-labelledby="home-about-title" {...revealProps}>
        <div className="site-shell home-about__inner">
          <div className="home-about__copy">
            <p className="section-kicker">About Gauvis</p>
            <h2 id="home-about-title">Your Technology Partner. Not Just Your IT Supplier.</h2>
            <div className="accent-rule" aria-hidden="true" />
            <p>
              Gauvis Technology Holdings provides practical technology solutions across hardware, software, networks
              and end-user support. We help businesses work smarter, stay secure and grow with confidence.
            </p>
            <ButtonLink href="/about" showArrow>Learn About Gauvis</ButtonLink>
          </div>
          <div className="home-about__media" aria-hidden="true">
            <div className="home-about__media-frame">
              <ResponsiveImage alt="" image={pageImages.about.story} sizes="(max-width: 48rem) 100vw, 50vw" />
            </div>
            <div className="home-about__wedge" />
          </div>
        </div>
      </m.section>

      <section className="home-services" id="services" aria-labelledby="home-services-title">
        <div className="site-shell">
          <m.div className="home-services__header" {...revealProps}>
            <div>
              <p className="section-kicker">Our Services</p>
              <h2 id="home-services-title">Technology Solutions for Every Business Need.</h2>
              <p>
                We provide end-to-end IT solutions, from hardware supply to ongoing support and maintenance.
              </p>
            </div>
            <a className="home-services__all" href="/services">View All Services <span aria-hidden="true">→</span></a>
          </m.div>
          <div className="services-grid">
            {services.map(([title, image, alt], index) => (
              <m.a
                className="service-card"
                href="/services"
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
                key={title}
                transition={
                  shouldReduceMotion
                    ? undefined
                    : { duration: 0.48, delay: index * 0.055, ease: [0.16, 1, 0.3, 1] }
                }
                viewport={shouldReduceMotion ? undefined : { once: true, amount: 0.12 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              >
                <div className="service-card__image">
                  <ResponsiveImage image={image} alt={alt} sizes="(max-width: 35rem) 100vw, (max-width: 64rem) 50vw, 25vw" />
                </div>
                <div className="service-card__body">
                  <h3>{title}</h3>
                  <span aria-hidden="true">→</span>
                </div>
              </m.a>
            ))}
          </div>
        </div>
      </section>

      <m.section className="ecosystems" aria-labelledby="ecosystems-title" {...revealProps}>
        <div className="site-shell ecosystems__inner">
          <h2 id="ecosystems-title">Technology ecosystems we work with</h2>
          <div className="ecosystem-logos" aria-label="Technology ecosystems">
            {brandLogos.map((brand) => (
              <img alt={brand.alt} key={brand.alt} loading="lazy" src={brand.src} />
            ))}
          </div>
        </div>
      </m.section>

      <section className="home-process" aria-labelledby="home-process-title">
        <div className="site-shell">
          <m.div className="home-process__heading" {...revealProps}>
            <h2 id="home-process-title">Our Process</h2>
            <p>From planning to support, we&apos;re with you at every step.</p>
          </m.div>
          <div className="home-process-grid">
            {process.map(([number, title, description]) => (
              <m.article className="home-process-step" key={title} {...revealProps}>
                <div className="home-process-step__number">{number}</div>
                <div className="home-process-step__rule" aria-hidden="true" />
                <h3>{title}</h3>
                <p>{description}</p>
              </m.article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-cta" aria-labelledby="home-cta-title">
        <div className="site-shell home-cta__inner">
          <div>
            <h2 id="home-cta-title">Let&apos;s Build a More Reliable <span>IT Environment.</span></h2>
            <p>Whatever your current IT situation, practical support starts with a conversation.</p>
          </div>
          <div className="home-cta__right">
            <p>
              Whether you need new hardware, network infrastructure, software deployment or ongoing IT support, our
              team can help. We come to you for all your IT needs.
            </p>
            <div className="home-cta__actions">
              <ButtonLink href="/contact#request-quote">Request a Quote</ButtonLink>
              <ButtonLink href="tel:0840356925" variant="light">
                <Phone aria-hidden="true" size={15} weight="fill" /> Call 084 035 6925
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
      </main>
    </LazyMotion>
  )
}
