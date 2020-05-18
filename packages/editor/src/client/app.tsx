import React from 'react'
import {hot} from 'react-hot-loader/root'

import {useRoute, RouteType, Route} from './route'

import {Login} from './login'
import {Base} from './base'
import {ArticleList} from './routes/articleList'

import {ArticleEditor} from './routes/articleEditor'
import {ImageList} from './routes/imageList'
import {PageList} from './routes/pageList'
import {PageEditor} from './routes/pageEditor'
import {AuthorList} from './routes/authorList'
import {PeerList} from './routes/peerList'
import {TokenList} from './routes/tokenList'

export function contentForRoute(route: Route) {
  switch (route.type) {
    case RouteType.Login:
      return <Login />

    case RouteType.PeerList:
    case RouteType.PeerProfileEdit:
    case RouteType.PeerCreate:
    case RouteType.PeerEdit:
      return <PeerList />

    case RouteType.TokenList:
    case RouteType.TokenGenerate:
      return <TokenList />

    case RouteType.Index:
    case RouteType.ArticleList:
      return <ArticleList />

    case RouteType.PageList:
      return <PageList />

    case RouteType.ImageList:
    case RouteType.ImageUpload:
    case RouteType.ImageEdit:
      return <ImageList />

    case RouteType.AuthorList:
    case RouteType.AuthorCreate:
    case RouteType.AuthorEdit:
      return <AuthorList />

    case RouteType.NotFound:
      return <ArticleList />
  }

  return null
}

export function App() {
  const {current} = useRoute()

  if (current) {
    switch (current.type) {
      case RouteType.Login:
        return <Login />

      case RouteType.ArticleCreate:
      case RouteType.ArticleEdit:
        return (
          <ArticleEditor
            id={current.type === RouteType.ArticleEdit ? current.params.id : undefined}
          />
        )

      case RouteType.PageCreate:
      case RouteType.PageEdit:
        return (
          <PageEditor id={current.type === RouteType.PageEdit ? current.params.id : undefined} />
        )

      default:
        return <Base>{contentForRoute(current)}</Base>
    }
  }

  return null
}

export const HotApp = hot(App)
