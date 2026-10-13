import styled from '@emotion/styled';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useCallback, useState } from 'react';

import { useAdsContext } from '../context/ads-context';
import { ReviveAd } from './revive-ad';

const REVIVE_ID = '727bec5e09208690b050ccfc6a45d384';

const ZONE_IDS = {
  whiteboard: '23516',
  'half-page': '23515',
  small: '23517',
} as const;

type AdvertisementProps = {
  type: 'whiteboard' | 'half-page' | 'small';
};

export const Advertisement = ({ type }: AdvertisementProps) => {
  const { adsDisabled, reviveStatus } = useAdsContext();
  if (adsDisabled || reviveStatus === 'blocked') {
    return null;
  }
  return <AdvertisementComponent type={type} />;
};

const AdvertisementComponent = ({ type }: AdvertisementProps) => {
  const theme = useTheme();
  const notLg = useMediaQuery(theme.breakpoints.down('sm'), {
    ssrMatchMedia: () => ({ matches: false }),
  });
  const [isEmpty, setIsEmpty] = useState(false);
  const onEmptyChange = useCallback((empty: boolean) => setIsEmpty(empty), []);

  const resolvedType = type === 'whiteboard' && notLg ? 'small' : type;
  const Wrapper = WRAPPERS[resolvedType];

  return (
    <Wrapper hidden={isEmpty}>
      <ReviveAd
        reviveId={REVIVE_ID}
        zoneId={ZONE_IDS[resolvedType]}
        onEmptyChange={onEmptyChange}
      />
    </Wrapper>
  );
};

const AdBox = styled(Box)`
  margin: 0 auto;

  &[hidden] {
    display: none;
  }

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

const WRAPPERS = {
  whiteboard: Wideboard,
  'half-page': HalfPage,
  small: Small,
} as const;
