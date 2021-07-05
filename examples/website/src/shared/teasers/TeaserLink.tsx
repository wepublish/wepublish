import React, {ReactNode} from 'react'
import {Link, Route} from '../route/routeContext'

export interface TeaserLinkProps {
  readonly url: string
  readonly route?: Route
  readonly children: ReactNode
  readonly className?: string
  readonly isPeerArticle?: boolean
}

export const TeaserLink = ({
  url,
  route,
  children,
  className,
  isPeerArticle = false
}: TeaserLinkProps) => {
  if (url && isPeerArticle) {
    return (
      <a className={`${className}`} href={url} rel="noreferrer" target="_blank">
        {children}
      </a>
    )
  } else if (route) {
    return (
      <Link className={`${className}`} route={route}>
        {children}
      </Link>
    )
  } else return <>{children}</>
}
