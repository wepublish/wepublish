import styled from '@emotion/styled';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { useAdsContext } from '../context/ads-context';
import { ReviveAd } from './revive-ad';

type AdvertisementProps = {
  type: 'whiteboard' | 'half-page' | 'small';
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

  if (type === 'whiteboard' && notLg) {
    type = 'small';
  }

  switch (type) {
    case 'whiteboard':
      return (
        <Wideboard>
          <ReviveAd
            key={version}
            reviveId={'727bec5e09208690b050ccfc6a45d384'}
            zoneId={'23516'}
          />
        </Wideboard>
      );
    case 'half-page':
      return (
        <HalfPage>
          <ReviveAd
            key={version}
            reviveId={'727bec5e09208690b050ccfc6a45d384'}
            zoneId={'23515'}
          />
        </HalfPage>
      );
    case 'small':
      return (
        <Small>
          <ReviveAd
            key={version}
            reviveId={'727bec5e09208690b050ccfc6a45d384'}
            zoneId={'23517'}
          />
        </Small>
      );
  }
};

const AdBox = styled(Box)`
  //background: repeating-linear-gradient(-45deg, #dde8ee, #dde8ee 15px, #eee 15px, #eee 40px);
  //border: 5px solid #eee;
  margin: 0 auto;

  img {
    height: 100%;
    width: 100%;
  }
`;

const Wideboard = styled(AdBox)`
  & {
    max-height: 250px;
    height: auto;
    width: 100%;
    aspect-ratio: 994/250;
  }
`;

const HalfPage = styled(AdBox)`
  & {
    height: 100%;
    max-height: calc(100vh - 120px);
    max-width: 300px;
    width: auto;
    aspect-ratio: 300/600;
  }
`;

const Small = styled(AdBox)`
  & {
    height: auto;
    max-width: 300px;
    width: 100%;
    aspect-ratio: 300/250;
  }
`;
