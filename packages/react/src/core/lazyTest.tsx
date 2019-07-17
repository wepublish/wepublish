import {lazy} from './lazy'
import React from 'react'

// export const LazyTestComponent = lazy('./component', async () => import('./component'))
export function LazyTestComponent() {
  return <div>Hello World</div>
}
