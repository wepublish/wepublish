import React, {ComponentType} from 'react'
import ReactDOM from 'react-dom'

import {
  preloadLazyComponents,
  StyleProvider,
  rehydrateStyles,
  createStyleRenderer
} from '@karma.run/react'

import {RouteProvider, RouteType, ElementID} from '../shared'

export interface ClientOptions {
  appComponent: ComponentType<{}>
}

export function hydrateClient(opts: ClientOptions): Promise<void> {
  return new Promise(resolve => {
    const onDOMContentLoaded = async () => {
      const renderedKeys = JSON.parse(
        document.getElementById(ElementID.RenderedPaths)!.textContent!
      )

      const styleRenderer = createStyleRenderer()

      await preloadLazyComponents(renderedKeys)
      rehydrateStyles(styleRenderer)

      ReactDOM.hydrate(
        <StyleProvider renderer={styleRenderer}>
          <RouteProvider initialRoute={{type: RouteType.Article}}>
            <opts.appComponent />
          </RouteProvider>
        </StyleProvider>,
        document.getElementById(ElementID.ReactRoot),
        () => resolve()
      )
    }

    if (document.readyState !== 'loading') {
      onDOMContentLoaded()
    } else {
      document.addEventListener('DOMContentLoaded', onDOMContentLoaded)
    }
  })
}
