/** @jsxImportSource @emotion/react */
import {useEffect, useState} from 'react'
import styled from '@emotion/styled'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {Typography} from '@mui/material'

const OVERLAY_KEY = 'adblock_overlay_dismissed_until'

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 9998;
  background: rgba(0, 0, 0, 0.6);
`

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 50vh;
  background: ${({theme}) => theme.palette.background.paper};
  z-index: 9999;
  padding: 3rem 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  clip-path: polygon(0 0, 100% 0, 100% 90%, 0 100%);
`

export const AdblockOverlay = () => {
  const [showOverlay, setShowOverlay] = useState(false)
  const {
    elements: {Button}
  } = useWebsiteBuilder()

  useEffect(() => {
    const timeout = setTimeout(() => {
      const adElements = document.querySelectorAll('ins[data-revive-zoneid]')
      if (!adElements.length) return

      const reviveLoaded = !!(window as any).reviveAsync

      let adBlocked = false

      adElements.forEach(el => {
        const elAsHTMLElement = el as HTMLElement
        const isHidden =
          elAsHTMLElement.offsetHeight === 0 ||
          elAsHTMLElement.offsetParent === null ||
          getComputedStyle(elAsHTMLElement).display === 'none'

        if (isHidden) {
          adBlocked = true

          const wrapper = elAsHTMLElement.closest('div, section, article')
          if (wrapper) {
            ;(wrapper as HTMLElement).style.display = 'none'
          }
        }
      })

      const dismissedUntil = localStorage.getItem(OVERLAY_KEY)
      const now = Date.now()
      if (reviveLoaded && adBlocked && (!dismissedUntil || now > parseInt(dismissedUntil, 10))) {
        setShowOverlay(true)
        document.body.style.overflow = 'hidden'
      }
    }, 1200)

    return () => clearTimeout(timeout)
  }, [])

  const handleClose = () => {
    const expireAt = Date.now() + 24 * 60 * 60 * 1000
    localStorage.setItem(OVERLAY_KEY, expireAt.toString())
    setShowOverlay(false)
    document.body.style.overflow = ''
  }

  if (!showOverlay) return null

  return (
    <>
      <Backdrop />
      <Overlay role="alertdialog" aria-modal="true">
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Warum kann ich diese Seite nicht lesen?
        </Typography>
        <Typography variant="body1" gutterBottom maxWidth={600}>
          Du siehst diese Seite, weil du einen Ad-Blocker installiert hast. <br />
          Das Geld aus der Werbung ermöglicht unseren Journalismus und ist für uns sehr wichtig.
        </Typography>
        <Typography variant="body1" gutterBottom>
          Danke, dass du den Ad-Blocker deaktivierst und die Seite neu lädst.
        </Typography>

        <Button color="primary" variant="contained" sx={{mt: 3}} onClick={handleClose}>
          Wie du deinen Ad-Blocker deaktivierst
        </Button>
      </Overlay>
    </>
  )
}
