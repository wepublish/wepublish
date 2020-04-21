import React, {ReactNode} from 'react'

import gql from 'graphql-tag'
import {useQuery} from 'react-apollo'
import {BaseTemplate} from '../templates/baseTemplate'
import {NavigationItem} from '../types'
import {PageRoute} from './routeContext'

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
    }
  }
`

export interface BaseTemplateContainerProps {
  footerText?: string
  largeHeader?: boolean
  hideHeaderMobile?: boolean
  children?: ReactNode
}

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

function dataToNavigation(data: any): NavigationItem[] {
  return data.links
    .filter((link: {__typename: string}) => link.__typename == 'PageNavigationLink')
    .map((link: any) => linkToNavigationItem(link))
}

function linkToNavigationItem(link: any): NavigationItem {
  return {
    title: link.label,
    route: PageRoute.create({slug: link.page?.slug ?? undefined}),
    isActive: false
  }
}
