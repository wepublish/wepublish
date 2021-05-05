import React, {useContext} from 'react'
import {ShepherdTour, ShepherdTourContext} from 'react-shepherd'
import {Button} from 'rsuite'

const tourOptions = {
  defaultStepOptions: {
    cancelIcon: {
      enabled: true
    }
  },
  useModalOverlay: true
}

export function GuideTour() {
  const tour = useContext(ShepherdTourContext)

  return (
    <Button className="button dark" onClick={tour?.start}>
      Start Tour
    </Button>
  )
}
