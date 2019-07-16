import React from 'react'
import ReactDOM from 'react-dom/server'

import {LazyCapture} from '../core/lazy'
import {LazyTestComponent} from '../core/lazyTest'

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
