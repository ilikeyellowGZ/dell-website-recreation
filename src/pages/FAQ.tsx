import {
  CaretRight,
  ChatCircle,
  ClipboardText,
  Desktop,
  GlobeHemisphereWest,
  Headset,
  MagnifyingGlass,
  Minus,
  Plus,
  ShieldCheck,
  WhatsappLogo,
} from '@phosphor-icons/react'
import { useMemo, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../assets'
import { ButtonLink } from '../components/ButtonLink'

type FAQCategory = 'General' | 'IT Support' | 'Websites' | 'Security & CCTV' | 'Quotes'

type FAQItem = {
  answer: string
  categories: FAQCategory[]
  question: string
}

type FAQCategoryItem = {
  category: FAQCategory
  Icon: ComponentType<{ 'aria-hidden': true; size: number; weight: 'regular' | 'bold' }>
}

const categories: FAQCategoryItem[] = [
  { category: 'General', Icon: ChatCircle },
  { category: 'IT Support', Icon: Desktop },
  { category: 'Websites', Icon: GlobeHemisphereWest },
  { category: 'Security & CCTV', Icon: ShieldCheck },
  { category: 'Quotes', Icon: ClipboardText },
]

const faqs: FAQItem[] = [
  {
    question: 'What services do you offer?',
    answer:
      'We assist with hardware repairs, software solutions, networking, desktop support, Microsoft 365, CCTV, printers and website development.',
    categories: ['General', 'IT Support', 'Websites', 'Security & CCTV', 'Quotes'],
  },
  {
    question: 'Do you provide on-site support?',
    answer:
      'Yes. Gauvis Tech provides on-site assistance. Contact us with your location and requirements to discuss the support you need.',
    categories: ['General', 'IT Support', 'Quotes'],
  },
  {
    question: 'Can you help my small business?',
    answer:
      'Yes. Our services include device setup, Microsoft 365, networking, websites and everyday IT support for small businesses.',
    categories: ['General', 'IT Support', 'Websites'],
  },
  {
    question: 'How do I request a quote?',
    answer:
      'Visit our Contact page and complete the Request a Quote form with your contact details, the service you need and a description of your requirements.',
    categories: ['General', 'Quotes'],
  },
  {
    question: 'Can I combine multiple services?',
    answer:
      'Yes. Tell us which services you need so we can discuss a setup that brings your hardware, software, networks and support together.',
    categories: ['General', 'IT Support', 'Websites', 'Security & CCTV', 'Quotes'],
  },
  {
    question: 'What information should I provide when enquiring?',
    answer:
      'Provide your name, email address, phone number, location, the service required and a brief description of your needs. You can also include your business name.',
    categories: ['General', 'Quotes'],
  },
]

function FAQAccordionItem({
  id,
  isOpen,
  item,
  onToggle,
}: {
  id: string
  isOpen: boolean
  item: FAQItem
  onToggle: () => void
}) {
  const panelId = `${id}-panel`
  const buttonId = `${id}-button`

  return (
    <article className={`faq-item${isOpen ? ' is-open' : ''}`}>
      <h3>
        <button
          aria-controls={panelId}
          aria-expanded={isOpen}
          className="faq-item__button"
          id={buttonId}
          onClick={onToggle}
          type="button"
        >
          <span className="faq-item__symbol" aria-hidden="true">
            {isOpen ? <Minus size={17} weight="bold" /> : <Plus size={17} weight="bold" />}
          </span>
          <span>{item.question}</span>
          <CaretRight aria-hidden="true" className="faq-item__caret" size={18} weight="bold" />
        </button>
      </h3>
      {isOpen ? (
        <div aria-labelledby={buttonId} className="faq-item__panel" id={panelId} role="region">
          <p>{item.answer}</p>
        </div>
      ) : null}
    </article>
  )
}

export function FAQ() {
  const [activeCategory, setActiveCategory] = useState<FAQCategory>('General')
  const [searchTerm, setSearchTerm] = useState('')
  const [openQuestion, setOpenQuestion] = useState(faqs[0].question)

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredFaqs = useMemo(
    () =>
      faqs.filter((item) => {
        const matchesCategory = item.categories.includes(activeCategory)
        const matchesSearch =
          !normalizedSearch ||
          item.question.toLowerCase().includes(normalizedSearch) ||
          item.answer.toLowerCase().includes(normalizedSearch)

        return matchesCategory && matchesSearch
      }),
    [activeCategory, normalizedSearch],
  )

  const handleCategoryChange = (category: FAQCategory) => {
    setActiveCategory(category)
    const firstInCategory = faqs.find((item) => item.categories.includes(category))
    if (firstInCategory) setOpenQuestion(firstInCategory.question)
  }

  return (
    <main id="main-content">
      <section className="faq-hero" aria-labelledby="faq-hero-title">
        <div className="site-shell faq-hero__inner">
          <div className="faq-hero__copy">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span aria-hidden="true">/</span>
              <span>FAQ</span>
            </nav>
            <p className="section-kicker">Frequently Asked Questions</p>
            <h1 id="faq-hero-title" tabIndex={-1}>
              Clear Answers. <span>Confident Decisions.</span>
            </h1>
            <p>Find answers about our services, support and getting started.</p>
          </div>
          <div className="faq-hero__media">
            <img
              src={assets.heroServerAisle}
              width="255"
              height="226"
              alt="Blue-lit server racks in a data centre"
              fetchPriority="high"
            />
          </div>
          <span className="faq-hero__accent" aria-hidden="true" />
        </div>
      </section>

      <section className="faq-main" aria-labelledby="faq-main-title">
        <div className="site-shell faq-main__inner">
          <h2 className="visually-hidden" id="faq-main-title">
            FAQ search and answers
          </h2>
          <div className="faq-search">
            <label className="visually-hidden" htmlFor="faq-search">
              Search questions
            </label>
            <MagnifyingGlass aria-hidden="true" size={31} weight="regular" />
            <input
              id="faq-search"
              name="faqSearch"
              type="search"
              autoComplete="off"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="faq-layout">
            <nav className="faq-categories" aria-label="FAQ categories">
              {categories.map(({ category, Icon }) => (
                <button
                  className="faq-category"
                  key={category}
                  type="button"
                  aria-pressed={activeCategory === category}
                  onClick={() => handleCategoryChange(category)}
                >
                  <Icon aria-hidden={true} size={29} weight="regular" />
                  <span>{category}</span>
                  {category === 'General' ? null : <CaretRight aria-hidden="true" size={18} weight="bold" />}
                </button>
              ))}
            </nav>

            <div className="faq-answer-list">
              <h2>{activeCategory} questions</h2>
              <p className="visually-hidden" role="status" aria-live="polite">
                {filteredFaqs.length} question{filteredFaqs.length === 1 ? '' : 's'} shown.
              </p>
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((item, index) => (
                  <FAQAccordionItem
                    id={`faq-${index}`}
                    isOpen={openQuestion === item.question}
                    item={item}
                    key={item.question}
                    onToggle={() => setOpenQuestion((current) => (current === item.question ? '' : item.question))}
                  />
                ))
              ) : (
                <div className="faq-empty" role="status">
                  <p>No questions match your search.</p>
                  <button type="button" onClick={() => setSearchTerm('')}>
                    Clear search
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="faq-assistance" aria-labelledby="faq-assistance-title">
        <div className="site-shell faq-assistance__inner">
          <div className="faq-assistance__copy">
            <Headset aria-hidden="true" size={72} weight="regular" />
            <span aria-hidden="true" />
            <div>
              <h2 id="faq-assistance-title">Still have a question?</h2>
              <p>Tell us what you need help with and we’ll guide you.</p>
            </div>
          </div>
          <div className="faq-assistance__actions">
            <ButtonLink href="/contact">Contact Us</ButtonLink>
            <button className="faq-whatsapp" type="button" disabled aria-describedby="faq-whatsapp-unavailable">
              <WhatsappLogo aria-hidden="true" size={24} weight="regular" />
              <span>WhatsApp Us</span>
            </button>
            <span className="visually-hidden" id="faq-whatsapp-unavailable">
              A WhatsApp recipient has not been configured.
            </span>
          </div>
        </div>
      </section>

      <section className="faq-cta" aria-labelledby="faq-cta-title">
        <div className="site-shell faq-cta__inner">
          <h2 id="faq-cta-title">
            Let&apos;s find the right <span>IT solution</span> for you.
          </h2>
          <ButtonLink href="/contact#request-quote">Request a Quote</ButtonLink>
        </div>
      </section>
    </main>
  )
}
