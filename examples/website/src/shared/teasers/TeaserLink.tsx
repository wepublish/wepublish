import React from 'react'
import {Link, Route} from '../route/routeContext'

export interface TeaserLinkProps {
  readonly url: string
  readonly route?: Route
}
export const TeaserLink = ({url, route, children}: any) => {
  if (route) {
    return <Link route={route}>{children}</Link>
  } else if (url) {
    return (
      <a href={url} rel="noreferrer" target="_blank">
        {children}
      </a>
    )
  } else return children
}
