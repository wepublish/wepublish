import React from 'react'
import {lazy} from '@wepublish/core'

export const LazyTestComponent2 = lazy('./test/component', async () => import('./test/component'))

export default function TestComponent() {
  return (
    <div>
      <LazyTestComponent2 />
    </div>
  )
}
