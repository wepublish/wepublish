import React, {useContext} from 'react'
import {RouteContext, useRoute} from '@wepublish/react'

export function App() {
  return <Test />
}

export function Test() {
  const route = useRoute()

  console.log(route)

  return <div>Hello World!!!!!!!!!</div>
}

export default App
