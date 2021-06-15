import React, {ReactNode, useEffect, useState} from 'react'
import {ShepherdTour} from 'react-shepherd'
import {options, versionOneSteps, versionTwoSteps, versionThreeSteps} from './tourSteps'

export const TourContext = React.createContext<any>({})

export interface ShepherdWrapperProps {
  children?: ReactNode
  tourVersion: number
}

const tourListMapper: any = {
  '1': versionOneSteps,
  '2': versionTwoSteps,
  '3': versionThreeSteps
}

export function ShepherdWrapper({children}: ShepherdWrapperProps) {
  const [tourVersion, setTourVersion] = useState<string>(localStorage.getItem('tourVersion') || '1')
  const [currentTourSteps, setCurrentTourSteps] = useState<any>(versionOneSteps)

  useEffect(() => {
    const currentVersionSteps = tourListMapper[tourVersion] ?? versionOneSteps

    setCurrentTourSteps(currentVersionSteps)
  }, [tourVersion])

  return (
    <TourContext.Provider value={{tourVersion, setTourVersion, currentTourSteps}}>
      <ShepherdTour steps={currentTourSteps} tourOptions={options}>
        {children}
      </ShepherdTour>
    </TourContext.Provider>
  )
}
