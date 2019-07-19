import React, {ComponentType} from 'react'
import ReactDOM from 'react-dom/server'

import {LazyCapture} from '@wepublish/react'
import {RouteProvider, Route} from '../shared'

export interface RenderedAppResult {
  componentString: string
  renderedLazyPaths: string[]
}

export interface RenderOptions {
  initialRoute: Route
  appComponent: ComponentType<{}>
}

export function renderApp(opts: RenderOptions): RenderedAppResult {
  const renderedLazyPaths: string[] = []
  const componentString = ReactDOM.renderToString(
    <LazyCapture rendered={renderedLazyPaths}>
      <RouteProvider initialRoute={opts.initialRoute}>
        <opts.appComponent />
      </RouteProvider>
    </LazyCapture>
  )

  return {
    componentString,
    renderedLazyPaths
  }
}
