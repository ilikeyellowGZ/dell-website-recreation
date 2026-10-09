import { ChatCircle, ClipboardText, FileText } from '@phosphor-icons/react'

const nextSteps = [
  { number: '01', title: 'We review your enquiry', description: 'Our team will take a look at your details and understand your needs.', Icon: ClipboardText },
  { number: '02', title: 'We discuss your requirements', description: 'We’ll get in touch to discuss the best solution for your business.', Icon: ChatCircle },
  { number: '03', title: 'We prepare your quote', description: 'You’ll receive a tailored quote based on your specific requirements.', Icon: FileText },
] as const

export function NextSteps() {
  return (
    <section className="next-steps" aria-labelledby="next-steps-title">
      <div className="site-shell">
        <h2 id="next-steps-title">What happens next?</h2>
        <p className="next-steps__intro">We’ll guide you through the next steps.</p>
        <div className="next-steps__grid">
          {nextSteps.map(({ number, title, description, Icon }) => (
            <article className="next-step" key={number}>
              <span className="next-step__number">{number}</span>
              <div>
                <Icon aria-hidden="true" className="next-step__icon" size={33} weight="regular" />
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
