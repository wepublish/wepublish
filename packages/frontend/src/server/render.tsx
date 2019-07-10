import React from 'react'
import ReactDOM from 'react-dom/server'

import {LazyTestComponent} from '../common/lazy'

export function render(): string {
  return ReactDOM.renderToString(<LazyTestComponent />)
}
