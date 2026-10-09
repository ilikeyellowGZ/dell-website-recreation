import { ArrowRight } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { assets } from '../assets'
import { ButtonLink } from '../components/ButtonLink'

type Solution = {
  answer: string
  problem: string
  services: string[]
  title: string
}

const solutions: Solution[] = [
  {
    title: 'For small businesses',
    problem: 'You need technology that works without a full IT department behind it.',
    answer: 'Reliable technology without unnecessary complexity — the right hardware, properly set up, with support you can actually reach.',
    services: ['Hardware Support', 'PC & Desktop Support', 'IT Support'],
  },
  {
    title: 'For growing businesses',
    problem: 'The team is expanding faster than the systems that were set up for it.',
    answer: 'Infrastructure that can scale as your team grows, so adding people does not mean rebuilding everything each time.',
    services: ['Networking Services', 'Hardware Support', 'Microsoft 365 Support'],
  },
  {
    title: 'For businesses with IT issues',
    problem: 'The same problems keep coming back and nobody has time to get to the bottom of them.',
    answer: 'Practical troubleshooting and support — remote first, on site when needed, with attention to why it keeps recurring.',
    services: ['IT Support', 'PC & Desktop Support', 'Printer Services'],
  },
  {
    title: 'For businesses moving to cloud',
    problem: 'You want email and files off the server in the cupboard, without breaking how people work.',
    answer: 'Microsoft 365 and cloud-related support, including migration, configuration and helping users through the change.',
    services: ['Microsoft 365 Support', 'Software Solutions', 'IT Support'],
  },
  {
    title: 'For businesses needing better security',
    problem: 'Premises and infrastructure need closer attention than they currently get.',
    answer: 'CCTV, network and infrastructure solutions — cameras where they matter, and networks configured deliberately.',
    services: ['CCTV & Security', 'Networking Services', 'IT Support'],
  },
  {
    title: 'For businesses needing a stronger digital presence',
    problem: 'Customers cannot find you, or what they find does not represent the business.',
    answer: 'Website development and digital solutions — responsive sites that make it clear what you do and easy to get hold of you.',
    services: ['Website Development', 'Software Solutions', 'Microsoft 365 Support'],
  },
]

function SolutionCard({ answer, problem, services, title }: Solution) {
  return (
    <article className="solution-card">
      <div className="solution-card__situation">
        <p className="solution-card__label">The situation</p>
        <h2>{title}</h2>
        <p>{problem}</p>
      </div>
      <div className="solution-card__answer">
        <p className="solution-card__answer-label">
          <ArrowRight aria-hidden="true" size={20} weight="bold" />
          <span>What we do about it</span>
        </p>
        <p>{answer}</p>
        <div className="solution-card__services" aria-label={`Related services for ${title}`}>
          {services.map((service) => (
            <Link to="/services" key={service}>{service}</Link>
          ))}
        </div>
      </div>
    </article>
  )
}

export function Solutions() {
  return (
    <main id="main-content">
      <section className="solutions-hero" aria-labelledby="solutions-hero-title">
        <div className="site-shell solutions-hero__inner">
          <div className="solutions-hero__copy">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span aria-hidden="true">/</span>
              <span>Solutions</span>
            </nav>
            <p className="section-kicker">Solutions</p>
            <h1 id="solutions-hero-title" tabIndex={-1}>
              Technology Solutions <span>Built Around Your Business.</span>
            </h1>
            <p>Most businesses do not arrive with a shopping list — they arrive with a problem. Find the situation that sounds like yours.</p>
          </div>
          <div className="solutions-hero__media">
            <img src={assets.serviceSouthAfrica} width="1600" height="900" alt="South African business district" fetchPriority="high" />
          </div>
        </div>
      </section>

      <section className="solutions-list" aria-label="Solutions by business need">
        <div className="site-shell solutions-list__inner">
          {solutions.map((solution) => <SolutionCard {...solution} key={solution.title} />)}
        </div>
      </section>

      <section className="solutions-cta" aria-labelledby="solutions-cta-title">
        <div className="site-shell solutions-cta__inner">
          <h2 id="solutions-cta-title">None of these quite fit? <span>Tell us what is happening.</span></h2>
          <div className="solutions-cta__actions">
            <ButtonLink href="/contact#request-quote">Talk to Gauvis</ButtonLink>
            <ButtonLink href="tel:+27840356925" variant="outline">Call 084 035 6925</ButtonLink>
          </div>
        </div>
      </section>
    </main>
  )
}
