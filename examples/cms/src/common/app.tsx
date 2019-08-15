import React from 'react'
import {useRoute} from '@wepublish/react'

export function App() {
  return <Test />
}

export function Test() {
  const route = useRoute()
  return <div>{route.type}</div>
}

export default App
