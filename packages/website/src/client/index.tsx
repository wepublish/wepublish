import {hot} from 'react-hot-loader/root'

import React from 'react'
import ReactDOM from 'react-dom'

import {preloadLazyComponents} from '@wepublish/core'
import {LazyTestComponent} from '../common/lazyTest'

export interface ClientOptions {}

const HotApp = hot(LazyTestComponent)

export class Client {
  constructor(_opts: ClientOptions) {}

  async hydrate(): Promise<void> {
    return new Promise(resolve => {
      async function onDOMContentLoaded() {
        const renderedKeys = JSON.parse(document.getElementById('renderedKeys')!.textContent!)

        await preloadLazyComponents(renderedKeys)

        ReactDOM.hydrate(<HotApp />, document.getElementById('reactRoot'), () => resolve())
      }

      if (document.readyState !== 'loading') {
        onDOMContentLoaded()
      } else {
        document.addEventListener('DOMContentLoaded', onDOMContentLoaded)
      }
    })
  }
}
