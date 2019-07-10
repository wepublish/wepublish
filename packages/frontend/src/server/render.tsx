import React from 'react'
import ReactDOM from 'react-dom/server'

import {LazyTestComponent, LazyCapture} from '../common/lazy'

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
