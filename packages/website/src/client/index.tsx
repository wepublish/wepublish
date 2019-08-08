import React, {ComponentType} from 'react'
import ReactDOM from 'react-dom'

import {preloadLazyComponents} from '@karma.run/react'
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

      await preloadLazyComponents(renderedKeys)

      ReactDOM.hydrate(
        <RouteProvider initialRoute={{type: RouteType.Article}}>
          <opts.appComponent />
        </RouteProvider>,
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
