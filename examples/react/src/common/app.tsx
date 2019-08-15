import React from 'react'
import {useRoute} from '@wepublish/react'
import {useStyle, cssRule} from '@karma.run/react'

export function App() {
  return <Test />
}

const testStyle = cssRule(() => ({
  backgroundColor: 'red'
}))

export function Test() {
  const route = useRoute()
  const {css} = useStyle()

  return <div className={css(testStyle)}>{route.type}</div>
}
