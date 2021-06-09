import React, {ReactNode} from 'react'
import {ShepherdTour} from 'react-shepherd'
import {options, newUserSteps, returnUserSteps} from './tourSteps'

export interface ShepherdWrapperProps {
  children?: ReactNode
}

export function ShepherdWrapper({children}: ShepherdWrapperProps) {
  const isReturnUser = localStorage.getItem('tourVersion') ?? false

  const tourVersion = isReturnUser ? returnUserSteps : newUserSteps

  return (
    <ShepherdTour steps={tourVersion} tourOptions={options}>
      {children}
    </ShepherdTour>
  )
}
