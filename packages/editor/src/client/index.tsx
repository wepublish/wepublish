import React, {ComponentType} from 'react'
import ReactDOM from 'react-dom'

import {preloadLazyComponents} from '@karma.run/react'
import {RouteProvider, RouteType} from '../shared'

export interface ClientOptions {
  appComponent: ComponentType<{}>
}

export class Client {
  private readonly appComponent: ComponentType<{}>

  constructor(opts: ClientOptions) {
    this.appComponent = opts.appComponent
  }

  async hydrate(): Promise<void> {
    return new Promise(resolve => {
      const onDOMContentLoaded = async () => {
        const renderedKeys = JSON.parse(document.getElementById('renderedKeys')!.textContent!)

        await preloadLazyComponents(renderedKeys)

        ReactDOM.hydrate(
          <RouteProvider initialRoute={{type: RouteType.Article}}>
            <this.appComponent />
          </RouteProvider>,
          document.getElementById('reactRoot'),
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
}
