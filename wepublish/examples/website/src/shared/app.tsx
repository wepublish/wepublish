import React from 'react'
import {Router} from './route/router'

import {GlobalStyles} from './style/globalStyles'

export function App() {
  return (
    <>
      <GlobalStyles />
      <Router />
    </>
  )
}
