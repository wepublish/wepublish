import React from 'react'
import ReactDOM from 'react-dom/server'
import {LazyCapture} from '@wepublish/core'

import {LazyTestComponent} from '../common/lazyTest'

export function render(): [string, string[]] {
  const renderedPaths: string[] = []

  return [
    ReactDOM.renderToString(
      <LazyCapture rendered={renderedPaths}>
        <LazyTestComponent />
      </LazyCapture>
    ),
    renderedPaths
  ]
}
