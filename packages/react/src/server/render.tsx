import React, {ComponentType} from 'react'
import ReactDOM from 'react-dom/server'

import {
  LazyCapture,
  StyleProvider,
  createStyleRenderer,
  renderStylesToMarkup
} from '@karma.run/react'

import {RouteProvider, Route} from '../shared'

export interface RenderedAppResult {
  componentString: string
  styleMarkup: string
  renderedLazyPaths: string[]
}

export interface RenderOptions {
  initialRoute: Route
  appComponent: ComponentType<{}>
}

export function renderApp(opts: RenderOptions): RenderedAppResult {
  const renderer = createStyleRenderer()

  const renderedLazyPaths: string[] = []
  const componentString = ReactDOM.renderToString(
    <LazyCapture rendered={renderedLazyPaths}>
      <StyleProvider renderer={renderer}>
        <RouteProvider initialRoute={opts.initialRoute}>
          <opts.appComponent />
        </RouteProvider>
      </StyleProvider>
    </LazyCapture>
  )

  const styleMarkup = renderStylesToMarkup(renderer)

  return {
    componentString,
    renderedLazyPaths,
    styleMarkup
  }
}
