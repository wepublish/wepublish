import React, {ReactNode} from 'react'

import gql from 'graphql-tag'
import {useQuery} from 'react-apollo'
import {BaseTemplate} from '../templates/baseTemplate'
import {NavigationItem} from '../types'
import {ArticleRoute, PageRoute, routes} from './routeContext'
import {createRouteContext} from '@karma.run/react/lib/cjs/route'

const NavigationQuery = gql`
  {
    main: navigation(key: "main") {
      ...BaseNavigations
    }

    footer: navigation(key: "footer") {
      ...BaseNavigations
    }
  }

  fragment BaseNavigations on Navigation {
    links {
      __typename

      ... on PageNavigationLink {
        label
        page {
          slug
        }
      }
      ... on ArticleNavigationLink {
        label
        article {
          id
        }
      }
      ... on ExternalNavigationLink {
        label
        url
      }
    }
  }
`

export interface BaseTemplateContainerProps {
  footerText?: string
  largeHeader?: boolean
  hideHeaderMobile?: boolean
  children?: ReactNode
}

export const {
  Link,
  routeLink,
  RouteProvider: BaseRouteProvider,
  matchRoute,
  useRoute,
  useRouteDispatch
} = createRouteContext(routes)

export function BaseTemplateContainer({
  hideHeaderMobile,
  largeHeader,
  children,
  footerText
}: BaseTemplateContainerProps) {
  const {data} = useQuery(NavigationQuery)

  const {main, footer} = data ?? {}
  const mainNavi = main ? dataToNavigation(main) : []
  const footerNavi = footer ? dataToNavigation(footer) : []

  return (
    <BaseTemplate
      footerText={footerText}
      largeHeader={largeHeader}
      hideHeaderMobile={hideHeaderMobile}
      navigationItems={mainNavi}
      headerNavigationItems={mainNavi}
      imprintNavigationItems={footerNavi}
      footerNavigationItems={footerNavi}>
      {children}
    </BaseTemplate>
  )
}

function linkToNavigationItem(link: any): NavigationItem {
  switch (link.__typename) {
    case 'PageNavigationLink':
      return {
        title: link.label,
        route: PageRoute.create({
          slug: link.page?.slug ?? undefined
        }),
        isActive: false
      }
    case 'ArticleNavigationLink':
      return {
        title: link.label,
        route: ArticleRoute.create({
          id: link.article?.id ?? undefined
        }),
        isActive: false
      }
    case 'ExternalNavigationLink':
      return {
        title: link.label,
        url: link.url,
        isActive: false
      }
    default:
      throw new Error('Unknown Link Type: ' + link.__typename)
  }
}

function dataToNavigation(data: any): NavigationItem[] {
  return data.links
    .filter(
      (link: {__typename: string}) =>
        link.__typename === 'ExternalNavigationLink' ||
        link.__typename === 'PageNavigationLink' ||
        link.__typename === 'ArticleNavigationLink'
    )
    .map((link: any) => linkToNavigationItem(link))
}
