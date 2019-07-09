import React from 'react'
import ReactDOM from 'react-dom'
import {Button} from '../common'

export interface ClientOptions {}

export class Client {
  constructor(_opts: ClientOptions) {}

  async hydrate(): Promise<void> {
    return new Promise(resolve => {
      function onDOMContentLoaded() {
        ReactDOM.hydrate(<Button />, document.body, () => resolve())
      }

      if (document.readyState === 'complete') {
        onDOMContentLoaded()
      } else {
        window.addEventListener('DOMContentLoaded', onDOMContentLoaded)
      }
    })
  }
}
