import React, {useContext, useEffect} from 'react'
import {useRoute, RouteType, Route} from './routeContext'

import {NotFoundTemplate} from '../templates/notFoundTemplate'
import {ArticleTemplateContainer, PeerArticleTemplateContainer} from './articleTemplateContainer'
import {BaseTemplateContainer, BaseTemplateContainerProps} from './baseTemplateContainer'
import {PageTemplateContainer} from './pageTemplateContainer'
import {AuthorTemplateContainer} from './authorTemplateContainer'
import {TagTemplateContainer} from './tagTemplateContainer'
import {LocalStorageKey} from '../utility'
import {AuthContext, AuthDispatchActionType, AuthDispatchContext} from '../authContext'
import {gql, useMutation} from '@apollo/client'
import {Login} from './login'

export function Router() {
  const {current} = useRoute()

  // Disable `scrollRestoration`.
  useEffect(() => {
    if ('scrollRestoration' in history && history.scrollRestoration !== 'manual') {
      history.scrollRestoration = 'manual'
    }
  }, [])

  // Handle scrolling.
  useEffect(() => {
    if (
      current &&
      current.scroll &&
      !current.hash?.startsWith('modal') &&
      !current.hash?.startsWith('overlay')
    ) {
      window.scrollTo(current.scroll.x, current.scroll.y)
    }

    if (current && current.hash) {
      const element = document.getElementById(current.hash)
      if (element) element.scrollIntoView()
    }
  }, [current])

  return (
    <BaseTemplateContainer {...containerPropsForRoute(current)}>
      {contentForRoute(current)}
    </BaseTemplateContainer>
  )
}

function containerPropsForRoute(route: Route | null): BaseTemplateContainerProps {
  switch (route?.type) {
    case RouteType.PeerArticle:
      return {
        hideHeaderMobile: true,
        largeHeader: true
      }

    case RouteType.Article:
      return {
        footerText: 'Hat Dir der Artikel gefallen?',
        hideHeaderMobile: true,
        largeHeader: true
      }

    case RouteType.Page:
      return {
        largeHeader: true
      }

    default:
      return {
        largeHeader: true
      }
  }
}

const LogoutMutation = gql`
  mutation Logout {
    revokeActiveSession
  }
`

function contentForRoute(activeRoute: Route | null) {
  switch (activeRoute?.type) {
    case RouteType.Page:
      return <PageTemplateContainer slug={activeRoute.params.slug || ''} />

    case RouteType.PeerArticle:
      return (
        <PeerArticleTemplateContainer
          peerID={activeRoute.params.peerID}
          id={activeRoute.params.id}
          slug={activeRoute.params.slug}
        />
      )

    case RouteType.Article:
      return <ArticleTemplateContainer id={activeRoute.params.id} slug={activeRoute.params.slug} />

    case RouteType.Author:
      return <AuthorTemplateContainer id={activeRoute.params.id} />

    case RouteType.Tag:
      return <TagTemplateContainer tag={activeRoute.params.tag} />

    case RouteType.Login:
      return <Login />

    case RouteType.Logout:
      const [logout] = useMutation(LogoutMutation)
      const {session} = useContext(AuthContext)
      const authDispatch = useContext(AuthDispatchContext)
      if (session) {
        logout()
        localStorage.removeItem(LocalStorageKey.SessionToken)
        authDispatch({type: AuthDispatchActionType.Logout})
      }
      return <PageTemplateContainer slug={''} />

    default:
      return <NotFoundTemplate />
  }
}
