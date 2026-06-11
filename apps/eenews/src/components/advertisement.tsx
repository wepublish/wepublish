import styled from '@emotion/styled';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { useAdsContext } from '../context/ads-context';
import { ReviveAd } from './revive-ad';

type AdvertisementProps = {
  type: 'leaderboard' | 'skyscraper' | 'medium-rectangle';
};

export const Advertisement = ({ type }: AdvertisementProps) => {
  const { adsDisabled } = useAdsContext();
  return <>{!adsDisabled && <AdvertisementComponent type={type} />}</>;
};

const AdvertisementComponent = ({ type }: AdvertisementProps) => {
  const theme = useTheme();
  const notLg = useMediaQuery(theme.breakpoints.down('sm'), {
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

  if (type === 'leaderboard' && notLg) {
    type = 'medium-rectangle';
  }

  switch (type) {
    case 'leaderboard':
      return (
        <Leaderboard>
          <ReviveAd
            key={version}
            reviveId={'727bec5e09208690b050ccfc6a45d384'}
            zoneId={'29587'}
          />
        </Leaderboard>
      );
    case 'skyscraper':
      return (
        <Skyscraper>
          <ReviveAd
            key={version}
            reviveId={'727bec5e09208690b050ccfc6a45d384'}
            zoneId={'29588'}
          />
        </Skyscraper>
      );
    case 'medium-rectangle':
      return (
        <MediumRectangle>
          <ReviveAd
            key={version}
            reviveId={'727bec5e09208690b050ccfc6a45d384'}
            zoneId={'29589'}
          />
        </MediumRectangle>
      );
  }
};

const AdBox = styled(Box)`
  margin: 0 auto;
  background: #e6ece9 url('/skeleton.gif') center / cover no-repeat;

  img {
    height: 100%;
    width: 100%;
  }
`;

const Leaderboard = styled(AdBox)`
  & {
    height: 90px;
    aspect-ratio: 728/90;
    margin: 0 auto;
  }

  &:empty {
    display: none;
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
    height: auto;
    max-width: 300px;
    width: 100%;
    aspect-ratio: 300/250;
  }
`;
