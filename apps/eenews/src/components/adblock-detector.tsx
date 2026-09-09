import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { useEffect, useState } from 'react';

import { useAdsContext } from '../context/ads-context';

const OVERLAY_KEY = 'adblock_overlay_dismissed_until';
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24h

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
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
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export const AdblockOverlay = () => {
  const { adsDisabled } = useAdsContext();

  return <>{!adsDisabled && <AdblockOverlayComponent />}</>;
};

const AdblockOverlayComponent = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const {
    elements: { Button },
  } = useWebsiteBuilder();

  useEffect(() => {
    const timeout = setTimeout(() => {
      // The Revive loader (servedby.revive-adserver.net) is on every ad-blocker
      // list, so a blocked client never gets `window.reviveAsync`. Using that as
      // the signal — rather than "are the <ins> slots empty?" — avoids nagging
      // readers who simply hit a page/zone with no ad booked (those still degrade
      // gracefully via the house-ad fallback in advertisement.tsx).
      const adBlocked = typeof (window as any).reviveAsync === 'undefined';
      if (!adBlocked) {
        return;
      }

      const dismissedUntil = localStorage.getItem(OVERLAY_KEY);
      const now = Date.now();
      if (!dismissedUntil || now > parseInt(dismissedUntil, 10)) {
        setShowOverlay(true);
        document.body.style.overflow = 'hidden';
      }
    }, 4200);

    return () => clearTimeout(timeout);
  }, []);

  const handleClose = () => {
    localStorage.setItem(
      OVERLAY_KEY,
      (Date.now() + DISMISS_DURATION).toString()
    );
    setShowOverlay(false);
    document.body.style.overflow = '';
  };

  if (!showOverlay) {
    return null;
  }

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
          Bitte deaktivieren Sie Ihren Ad-Blocker
        </Typography>
        <Typography
          variant="body1"
          gutterBottom
          maxWidth={600}
        >
          ee-news.ch finanziert sich über Werbung und bleibt dadurch für Sie
          kostenlos. Wir haben festgestellt, dass Sie einen Ad-Blocker
          verwenden.
        </Typography>
        <Typography
          variant="body1"
          gutterBottom
          maxWidth={600}
        >
          Bitte deaktivieren Sie ihn für ee-news.ch und laden Sie die Seite neu
          – so unterstützen Sie unseren unabhängigen Journalismus. Vielen Dank!
        </Typography>

        <Buttons>
          <Button
            color="primary"
            variant="contained"
            sx={{ mt: 3 }}
            href={'/adblocker-deaktivieren'}
            onClick={handleClose}
          >
            So deaktivieren Sie den Ad-Blocker
          </Button>
          <Button
            color="secondary"
            variant="contained"
            sx={{ mt: 3 }}
            onClick={handleClose}
          >
            Trotzdem weiterlesen
          </Button>
        </Buttons>
      </Overlay>
    </>
  );
};
