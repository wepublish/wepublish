import {useEffect} from 'react'

interface ReviveAdProps {
  zoneId: string
  reviveId: string
}

export const ReviveAd: React.FC<ReviveAdProps> = ({zoneId, reviveId}) => {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = '//servedby.revive-adserver.net/asyncjs.php'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <ins data-revive-zoneid={zoneId} data-revive-id={reviveId} style={{display: 'block'}}></ins>
  )
}

export default ReviveAd
