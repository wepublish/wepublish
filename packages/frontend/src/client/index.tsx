import React from 'react'
import ReactDOM from 'react-dom'
import {LazyTestComponent, preload} from '../common/lazy'

export interface ClientOptions {}

export class Client {
  constructor(_opts: ClientOptions) {}

  async hydrate(): Promise<void> {
    return new Promise(resolve => {
      async function onDOMContentLoaded() {
        const renderedKeys = JSON.parse(document.getElementById('renderedKeys')!.textContent!)
        await preload(renderedKeys)
        ReactDOM.hydrate(<LazyTestComponent />, document.getElementById('reactRoot'), () =>
          resolve()
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
