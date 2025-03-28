import {useEffect} from 'react'

interface ReviveAdProps {
  zoneId: string
  reviveId: string
}

export const ReviveAd: React.FC<ReviveAdProps> = ({zoneId, reviveId}) => {
  useEffect(() => {
    if ((window as any).reviveAsync) {
      ;(window as any).reviveAsync[reviveId].refresh()
    }
  }, [reviveId])

  return <ins data-revive-zoneid={zoneId} data-revive-id={reviveId} style={{display: 'block'}} />
}

export default ReviveAd
