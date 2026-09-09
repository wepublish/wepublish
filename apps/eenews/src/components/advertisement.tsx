import styled from '@emotion/styled';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import { useAdsContext } from '../context/ads-context';
import { ReviveAd } from './revive-ad';

type AdType = 'leaderboard' | 'skyscraper' | 'medium-rectangle';

type AdvertisementProps = {
  type: AdType;
};

const REVIVE_ID = '727bec5e09208690b050ccfc6a45d384';

export const Advertisement = ({ type }: AdvertisementProps) => {
  const { adsDisabled } = useAdsContext();
  return <>{!adsDisabled && <AdvertisementComponent type={type} />}</>;
};

const AdvertisementComponent = ({ type }: AdvertisementProps) => {
  const theme = useTheme();
  const belowMd = useMediaQuery(theme.breakpoints.down('md'), {
    ssrMatchMedia: () => ({ matches: false }),
  });
  const [version, setVersion] = useState(0);

  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = () => {
      setVersion(version => version + 1);
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  if (type === 'leaderboard' && belowMd) {
    type = 'medium-rectangle';
  }

  switch (type) {
    case 'leaderboard':
      return (
        <AdSlot
          Wrapper={Leaderboard}
          zoneId="29587"
          fallbackSrc="/house/leaderboard.png"
          version={version}
        />
      );
    case 'skyscraper':
      return (
        <AdSlot
          Wrapper={Skyscraper}
          zoneId="29588"
          fallbackSrc="/house/skyscraper.png"
          version={version}
        />
      );
    case 'medium-rectangle':
      return (
        <AdSlot
          Wrapper={MediumRectangle}
          zoneId="29589"
          fallbackSrc="/house/rectangle.png"
          version={version}
        />
      );
  }
};

type AdStatus = 'loading' | 'filled' | 'fallback';

type AdSlotProps = {
  Wrapper: typeof Leaderboard;
  zoneId: string;
  fallbackSrc: string;
  version: number;
};

// While the Revive ad loads we show the skeleton. If the `<ins>` never fills —
// blocked by an ad-blocker, or simply no ad booked for the zone — we swap in a
// house-ad placeholder instead of leaving the skeleton shimmering forever. A
// MutationObserver also catches ads that fill late and clears the fallback.
const AdSlot = ({ Wrapper, zoneId, fallbackSrc, version }: AdSlotProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<AdStatus>('loading');

  useEffect(() => {
    setStatus('loading');

    const element = ref.current;
    if (!element) {
      return;
    }

    const isFilled = () => {
      const ins = element.querySelector('ins[data-revive-zoneid]');
      return (
        ins instanceof HTMLElement &&
        ins.offsetHeight > 0 &&
        ins.childElementCount > 0
      );
    };

    const observer = new MutationObserver(() => {
      if (isFilled()) {
        setStatus('filled');
      }
    });
    observer.observe(element, { childList: true, subtree: true });

    const timer = setTimeout(() => {
      setStatus(isFilled() ? 'filled' : 'fallback');
    }, 3500);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [version, zoneId]);

  return (
    <Wrapper
      ref={ref}
      status={status}
    >
      <ReviveAd
        key={version}
        reviveId={REVIVE_ID}
        zoneId={zoneId}
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
