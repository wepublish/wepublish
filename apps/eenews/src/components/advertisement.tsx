import styled from '@emotion/styled';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

import { useAdsContext } from '../context/ads-context';
import { ReviveAd, ReviveSlotStatus } from './revive-ad';

type AdType = 'leaderboard' | 'skyscraper' | 'medium-rectangle';

type AdvertisementProps = {
  type: AdType;
};

const REVIVE_ID = '727bec5e09208690b050ccfc6a45d384';

const AD_SLOTS = {
  leaderboard: { zoneId: '29587', fallbackSrc: '/house/leaderboard.png' },
  skyscraper: { zoneId: '29588', fallbackSrc: '/house/skyscraper.png' },
  'medium-rectangle': { zoneId: '29589', fallbackSrc: '/house/rectangle.png' },
} as const;

export const Advertisement = ({ type }: AdvertisementProps) => {
  const { adsDisabled } = useAdsContext();
  if (adsDisabled) {
    return null;
  }
  return <AdvertisementComponent type={type} />;
};

const AdvertisementComponent = ({ type }: AdvertisementProps) => {
  const theme = useTheme();
  const belowMd = useMediaQuery(theme.breakpoints.down('md'), {
    ssrMatchMedia: () => ({ matches: false }),
  });

  const resolvedType =
    type === 'leaderboard' && belowMd ? 'medium-rectangle' : type;
  const Wrapper = WRAPPERS[resolvedType];

  return (
    <AdSlot
      Wrapper={Wrapper}
      {...AD_SLOTS[resolvedType]}
    />
  );
};

type AdStatus = 'loading' | 'filled' | 'fallback';

type AdSlotProps = {
  Wrapper: typeof Leaderboard;
  zoneId: string;
  fallbackSrc: string;
};

const FALLBACK_TIMEOUT_MS = 4000;

// While the Revive ad loads we show the skeleton. Revive's delivery event
// reports whether the zone filled; a blocked script or a silent zone swaps in
// a house-ad placeholder, and a late fill clears it again.
const AdSlot = ({ Wrapper, zoneId, fallbackSrc }: AdSlotProps) => {
  const { reviveStatus } = useAdsContext();
  const [status, setStatus] = useState<AdStatus>('loading');

  const onStatusChange = useCallback((slotStatus: ReviveSlotStatus) => {
    setStatus(slotStatus === 'empty' ? 'fallback' : slotStatus);
  }, []);

  useEffect(() => {
    if (reviveStatus === 'blocked') {
      setStatus(current => (current === 'filled' ? current : 'fallback'));
    }
  }, [reviveStatus]);

  useEffect(() => {
    if (status !== 'loading') {
      return;
    }
    const timer = setTimeout(() => setStatus('fallback'), FALLBACK_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [status]);

  return (
    <Wrapper status={status}>
      <ReviveAd
        reviveId={REVIVE_ID}
        zoneId={zoneId}
        onStatusChange={onStatusChange}
      />
      {status === 'fallback' && (
        <img
          src={fallbackSrc}
          alt=""
        />
      )}
    </Wrapper>
  );
};

const AdBox = styled(Box, {
  shouldForwardProp: prop => prop !== 'status',
})<{ status: AdStatus }>`
  position: relative;
  margin: 0 auto;
  background-color: #e6ece9;

  img {
    height: 100%;
    width: 100%;
  }

  // House-ad fallback overlays the whole slot regardless of the (empty) ad markup.
  & > img {
    position: absolute;
    inset: 0;
    object-fit: contain;
  }

  ${({ status }) =>
    status === 'loading' &&
    `
    background-image: url('/skeleton.gif');
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
  `}
`;

const Leaderboard = styled(AdBox)`
  & {
    height: 90px;
    aspect-ratio: 728/90;
    margin: 0 auto;
  }
`;

const Skyscraper = styled(AdBox)`
  & {
    width: 160px;
    aspect-ratio: 160/600;
    position: sticky;
    top: calc(var(--navbar-height) + ${({ theme }) => theme.spacing(6)});
    margin-bottom: ${({ theme }) => theme.spacing(6)};
  }
`;

const MediumRectangle = styled(AdBox)`
  & {
    position: relative;
    height: auto;
    max-width: 300px;
    width: 100%;
    aspect-ratio: 300/250;
    overflow: hidden;
  }

  & > div,
  & ins,
  & iframe {
    display: block;
    width: 100%;
    height: 100%;
  }

  & ins {
    position: absolute;
    inset: 0;
  }
`;

const WRAPPERS = {
  leaderboard: Leaderboard,
  skyscraper: Skyscraper,
  'medium-rectangle': MediumRectangle,
} as const;
