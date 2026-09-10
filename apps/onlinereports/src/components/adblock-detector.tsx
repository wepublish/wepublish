import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { useEffect, useState } from 'react';

import { useAdsContext } from '../context/ads-context';
import { isReviveAvailable } from './revive-ad';

const OVERLAY_KEY = 'adblock_overlay_dismissed_until';
const BLOCK_CONFIRM_TIMEOUT_MS = 15000;

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

const isDismissed = () => {
  try {
    const dismissedUntil = localStorage.getItem(OVERLAY_KEY);
    return !!dismissedUntil && Date.now() <= parseInt(dismissedUntil, 10);
  } catch {
    return true;
  }
};

export const AdblockOverlay = () => {
  const { adsDisabled, reviveStatus, setReviveStatus } = useAdsContext();
  const [showOverlay, setShowOverlay] = useState(false);
  const {
    elements: { Button },
  } = useWebsiteBuilder();

  useEffect(() => {
    if (reviveStatus !== 'pending') {
      return;
    }
    const timeout = setTimeout(() => {
      if (!isReviveAvailable()) {
        setReviveStatus('blocked');
      }
    }, BLOCK_CONFIRM_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [reviveStatus, setReviveStatus]);

  useEffect(() => {
    if (adsDisabled || reviveStatus !== 'blocked' || isDismissed()) {
      return;
    }
    setShowOverlay(true);
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [adsDisabled, reviveStatus]);

  const handleClose = () => {
    try {
      localStorage.setItem(
        OVERLAY_KEY,
        (Date.now() + 24 * 60 * 60 * 1000).toString()
      );
    } catch {
      // storage unavailable, dismiss for this page view only
    }
    setShowOverlay(false);
    document.body.style.overflow = '';
  };

  if (!showOverlay || adsDisabled) {
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
