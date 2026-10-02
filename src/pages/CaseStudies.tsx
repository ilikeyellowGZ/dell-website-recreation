import {
  ArrowRight,
  Code,
  Desktop,
  FileText,
  GearSix,
  Info,
  Network,
  ShieldCheck,
  X,
} from '@phosphor-icons/react'
import { flushSync } from 'react-dom'
import { useId, useMemo, useRef, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../assets'
import { ButtonLink } from '../components/ButtonLink'

type ProjectCategory = 'Networking' | 'Security' | 'Websites' | 'IT Support'
type ProjectFilter = 'All Projects' | ProjectCategory

type Project = {
  alt: string
  category: ProjectCategory
  description: string
  image: string
  title: string
  Icon: ComponentType<{ 'aria-hidden': true; size: number; weight: 'regular' | 'bold' }>
}

const filters: ProjectFilter[] = ['All Projects', 'Networking', 'Security', 'Websites', 'IT Support']

const projects: Project[] = [
  {
    title: 'Office Network Setup',
    category: 'Networking',
    description: 'Network layout, device connections and shared access.',
    image: assets.serviceNetwork,
    alt: 'Network rack with connected blue cables',
    Icon: Network,
  },
  {
    title: 'Business CCTV Installation',
    category: 'Security',
    description: 'Camera placement, system configuration and viewing setup.',
    image: assets.serviceCctv,
    alt: 'CCTV security camera in a business environment',
    Icon: ShieldCheck,
  },
  {
    title: 'Business Website Design',
    category: 'Websites',
    description: 'A responsive website with clear services and enquiry forms.',
    image: assets.serviceWebsite,
    alt: 'Desktop monitor displaying a business website',
    Icon: Code,
  },
  {
    title: 'Workstation & Microsoft 365 Setup',
    category: 'IT Support',
    description: 'Device configuration, business email and productivity tools.',
    image: assets.servicePc,
    alt: 'Office workstations with desktop computers',
    Icon: Desktop,
  },
]

const processStages = [
  {
    number: '01',
    title: 'Understand',
    description: 'We take time to understand your business needs and objectives.',
    Icon: Desktop,
  },
  {
    number: '02',
    title: 'Plan',
    description: 'We design a practical solution aligned to your goals.',
    Icon: FileText,
  },
  {
    number: '03',
    title: 'Deliver',
    description: 'We implement the solution and ensure everything is working as expected.',
    Icon: GearSix,
  },
] as const

function ProjectCard({
  project,
  onExplore,
}: {
  project: Project
  onExplore: (project: Project, trigger: HTMLButtonElement) => void
}) {
  const { Icon } = project

  return (
    <article className="project-card">
      <div className="project-card__image">
        <img src={project.image} width="255" height="171" alt={project.alt} loading="lazy" />
        <span className="project-card__badge">ILLUSTRATIVE EXAMPLE</span>
      </div>
      <div className="project-card__body">
        <Icon aria-hidden={true} size={44} weight="regular" />
        <div className="project-card__copy">
          <p>{project.category}</p>
          <h2>{project.title}</h2>
          <span>{project.description}</span>
        </div>
      </div>
      <button
        className="project-card__action"
        onClick={(event) => onExplore(project, event.currentTarget)}
        type="button"
        aria-label={`Explore project scope for ${project.title}`}
      >
        <span>Explore project scope</span>
        <ArrowRight aria-hidden="true" size={15} weight="bold" />
      </button>
    </article>
  )
}

function ProjectScopeDialog({
  onClose,
  project,
  trigger,
}: {
  onClose: () => void
  project: Project
  trigger: HTMLButtonElement | null
}) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const setDialogElement = (node: HTMLDialogElement | null) => {
    dialogRef.current = node
    if (!node) return
    if (typeof node.showModal === 'function' && !node.open) node.showModal()
    else node.setAttribute('open', '')
    queueMicrotask(() => closeRef.current?.focus())
  }

  const handleClose = () => {
    flushSync(() => onClose())
    trigger?.focus()
  }

  return (
    <dialog
      className="project-dialog"
      ref={setDialogElement}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        handleClose()
      }}
    >
      <div className="project-dialog__panel">
        <button className="project-dialog__close" type="button" onClick={handleClose} ref={closeRef} aria-label="Close">
          <X aria-hidden="true" size={18} weight="bold" />
        </button>
        <p className="project-dialog__category">{project.category}</p>
        <h2 id={titleId}>{project.title}</h2>
        <p className="project-dialog__badge">Illustrative project examples.</p>
        <p>{project.description}</p>
        <ButtonLink href="/contact#request-quote" showArrow>
          Discuss Your Project
        </ButtonLink>
      </div>
    </dialog>
  )
}

export function CaseStudies() {
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>('All Projects')
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [dialogTrigger, setDialogTrigger] = useState<HTMLButtonElement | null>(null)

  const visibleProjects = useMemo(
    () =>
      activeFilter === 'All Projects'
        ? projects
        : projects.filter((project) => project.category === activeFilter),
    [activeFilter],
  )

  const handleExplore = (project: Project, trigger: HTMLButtonElement) => {
    setDialogTrigger(trigger)
    setActiveProject(project)
  }

  return (
    <main id="main-content">
      <section className="case-hero" aria-labelledby="case-hero-title">
        <div className="site-shell case-hero__inner">
          <div className="case-hero__copy">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span aria-hidden="true">/</span>
              <span>Case Studies</span>
            </nav>
            <h1 id="case-hero-title" tabIndex={-1}>
              Practical Solutions. <span>Projects in Focus.</span>
            </h1>
            <p>Explore the types of projects Gauvis Tech can support.</p>
          </div>
          <div className="case-hero__media">
            <img
              src={assets.heroCabling}
              width="255"
              height="226"
              alt="Server rack with connected network cables"
              fetchPriority="high"
            />
          </div>
          <span className="case-hero__accent" aria-hidden="true" />
        </div>
      </section>

      <section className="project-showcase" aria-labelledby="project-showcase-title">
        <div className="site-shell project-showcase__inner">
          <h2 className="visually-hidden" id="project-showcase-title">
            Illustrative project examples
          </h2>
          <aside className="project-disclosure" aria-label="Project disclosure">
            <Info aria-hidden="true" size={18} weight="fill" />
            <p>Illustrative project examples.</p>
          </aside>
          <div className="project-filters" aria-label="Project filters">
            {filters.map((filter) => (
              <button
                className="project-filter"
                key={filter}
                type="button"
                aria-pressed={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          <p className="visually-hidden" role="status" aria-live="polite">
            Showing {visibleProjects.length} illustrative project {visibleProjects.length === 1 ? 'example' : 'examples'}.
          </p>
          <div className="project-grid">
            {visibleProjects.map((project) => (
              <ProjectCard project={project} key={project.title} onExplore={handleExplore} />
            ))}
          </div>
        </div>
      </section>

      <section className="case-process" aria-labelledby="case-process-title">
        <div className="site-shell case-process__inner">
          <div className="case-process__intro">
            <h2 id="case-process-title">
              Every project starts with <span>your business needs.</span>
            </h2>
            <p>A clear and structured approach to deliver practical IT solutions for your business.</p>
          </div>
          <div className="case-process__steps">
            {processStages.map(({ number, title, description, Icon }) => (
              <article className="case-process-step" key={title}>
                <div className="case-process-step__header">
                  <span>{number}</span>
                  <Icon aria-hidden={true} size={30} weight="regular" />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="case-cta" aria-labelledby="case-cta-title">
        <div className="site-shell case-cta__inner">
          <div>
            <h2 id="case-cta-title">Have a project in mind?</h2>
            <p>Let’s discuss how Gauvis Tech can support your business with a practical and reliable solution.</p>
          </div>
          <ButtonLink href="/contact#request-quote" showArrow>
            Discuss Your Project
          </ButtonLink>
        </div>
      </section>

      {activeProject ? (
        <ProjectScopeDialog onClose={() => setActiveProject(null)} project={activeProject} trigger={dialogTrigger} />
      ) : null}
    </main>
  )
}
