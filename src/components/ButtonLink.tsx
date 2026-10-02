import { ArrowRight } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ButtonLinkProps = {
  children: ReactNode
  className?: string
  href: string
  showArrow?: boolean
  variant?: 'primary' | 'outline' | 'light'
}

export function ButtonLink({
  children,
  className = '',
  href,
  showArrow = false,
  variant = 'primary',
}: ButtonLinkProps) {
  const classes = `button button--${variant} ${className}`.trim()
  const content = (
    <>
      <span>{children}</span>
      {showArrow ? <ArrowRight aria-hidden="true" size={16} weight="bold" /> : null}
    </>
  )

  if (href.startsWith('/') && !href.endsWith('.html')) {
    return (
      <Link className={classes} to={href}>
        {content}
      </Link>
    )
  }

  return (
    <a className={classes} href={href}>
      {content}
    </a>
  )
}
