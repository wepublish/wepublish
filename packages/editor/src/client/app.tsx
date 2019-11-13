import React from 'react'

import {useRoute, RouteType, Route} from './route'

import {Login} from './login'
import {Base} from './base'
import {ArticleList} from './routes/articleList'

import {ArticleEditor} from './routes/articleEditor'
import {ImageList} from './routes/imageList'

export function contentForRoute(route: Route) {
  switch (route.type) {
    case RouteType.Login:
      return <Login />

    case RouteType.Index:
      return <ArticleList />

    case RouteType.ArticleList:
      return <ArticleList />

    case RouteType.ArticleCreate:
      return <ArticleEditor />

    case RouteType.FrontList:
      return null

    case RouteType.ImageList:
    case RouteType.ImageUpload:
    case RouteType.ImageEdit:
      return <ImageList />

    case RouteType.NotFound:
      return null
  }

  return null
}

export function App() {
  const {current} = useRoute()

  if (current) {
    switch (current.type) {
      case RouteType.Login:
        return <Login />

      case RouteType.Index:
      case RouteType.ArticleList:
      case RouteType.FrontList:
      case RouteType.ImageList:
      case RouteType.ImageUpload:
      case RouteType.ImageEdit:
      case RouteType.NotFound:
        return <Base>{contentForRoute(current)}</Base>

      case RouteType.ArticleCreate:
      case RouteType.ArticleEdit:
        return (
          <ArticleEditor
            id={current.type === RouteType.ArticleEdit ? current.params.id : undefined}
          />
        )
    }
  }

  return null
}
