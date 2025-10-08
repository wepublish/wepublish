/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { useEffect, useState } from 'react';

import { useAdsContext } from '../context/ads-context';

const OVERLAY_KEY = 'adblock_overlay_dismissed_until';

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 9998;
  background: rgba(0, 0, 0, 0.6);
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  min-height: 60vh;
  background: ${({ theme }) => theme.palette.background.paper};
  z-index: 9999;
  padding: 3rem 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 5vw), 0 100%);
`;

const Buttons = styled('div')`
  display: flex;
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export const AdblockOverlay = () => {
  const { adsDisabled } = useAdsContext();

  return <>{!adsDisabled && <AdblockOverlayComponent />}</>;
};

export const AdblockOverlayComponent = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const {
    elements: { Button },
  } = useWebsiteBuilder();

  useEffect(() => {
    const timeout = setTimeout(() => {
      const adElements = document.querySelectorAll('ins[data-revive-zoneid]');
      if (!adElements.length) return;

      let adBlocked = true;

      adElements.forEach(el => {
        const elAsHTMLElement = el as HTMLElement;
        const isHidden =
          elAsHTMLElement.offsetHeight === 0 ||
          elAsHTMLElement.offsetParent === null ||
          getComputedStyle(elAsHTMLElement).display === 'none';

        if (isHidden) {
          const wrapper = elAsHTMLElement.parentElement
            ?.parentElement as HTMLElement | null;
          if (wrapper) {
            wrapper.style.display = 'none';
          }
        } else {
          adBlocked = false;
        }
      });

      const dismissedUntil = localStorage.getItem(OVERLAY_KEY);
      const now = Date.now();
      if (
        adBlocked &&
        (!dismissedUntil || now > parseInt(dismissedUntil, 10))
      ) {
        setShowOverlay(true);
        document.body.style.overflow = 'hidden';
      }
    }, 4200);

    return () => clearTimeout(timeout);
  }, []);

  const handleClose = () => {
    const expireAt = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(OVERLAY_KEY, expireAt.toString());
    setShowOverlay(false);
    document.body.style.overflow = '';
  };

  if (!showOverlay) return null;

  return (
    <>
      <Backdrop />
      <Overlay
        role="alertdialog"
        aria-modal="true"
      >
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
        >
          Warum Sie diese Seite nicht lesen können?
        </Typography>
        <Typography
          variant="body1"
          gutterBottom
          maxWidth={600}
        >
          Sie haben einen Ad-Blocker installiert. Doch nur dank des Umsatzes aus
          der Werbung können wir Ihnen weiterhin einen kostenlosen Zugang zu
          unseren journalistischen Inhalten bieten.
        </Typography>
        <Typography
          variant="body1"
          gutterBottom
        >
          Danke, dass Sie den Ad-Blocker deaktivieren und die Seite neu laden.
        </Typography>

        <Buttons>
          <Button
            color="primary"
            variant="contained"
            sx={{ mt: 3 }}
            href={'/adblocker-deaktivieren'}
            onClick={handleClose}
          >
            Wie Sie den Adblocker deaktivieren
          </Button>
          <Button
            color="secondary"
            variant="contained"
            sx={{ mt: 3 }}
            onClick={handleClose}
          >
            Fenster schliessen
          </Button>
        </Buttons>
      </Overlay>
    </>
  );
};
