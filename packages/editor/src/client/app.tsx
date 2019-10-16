import React from 'react'
import {useRoute, RouteType} from './route'
import {Login} from './login'
import {Base} from './base'

export function App() {
  const {current} = useRoute()

  switch (current && current.type) {
    case RouteType.Login:
      return <Login />

    case RouteType.Index:
      return <Base></Base>

    case RouteType.ArticleList:
      return <Base></Base>

    case RouteType.NotFound:
      return <Base></Base>
  }

  return <div>Loading...</div>
}
