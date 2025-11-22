import { css, GlobalStyles, Theme, useTheme } from '@mui/material';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass, anyPass } from 'ramda';
import { memo, useId, useMemo } from 'react';
import { Ad } from 'react-ad-manager';
import { AdSizeType } from 'react-ad-manager/dist/types';

export const isAdTeaser = allPass([
  ({ teaser }: BuilderTeaserProps) => teaser?.__typename === 'CustomTeaser',
  anyPass([
    ({ teaser }: BuilderTeaserProps) => teaser?.preTitle === 'ad-970x250',
    ({ teaser }: BuilderTeaserProps) => teaser?.preTitle === 'ad-728x90',
    ({ teaser }: BuilderTeaserProps) => teaser?.preTitle === 'ad-320x480',
    ({ teaser }: BuilderTeaserProps) => teaser?.preTitle === 'ad-320x416',
    ({ teaser }: BuilderTeaserProps) => teaser?.preTitle === 'ad-300x600',
    ({ teaser }: BuilderTeaserProps) => teaser?.preTitle === 'ad-300x250',
  ]),
]);

const adCss = (theme: Theme, id: string, showMobile: boolean) => css`
  #${id} {
    display: grid;
    justify-items: center;

    > * {
      display: inline-block;
    }

    ${!showMobile && theme.breakpoints.down('md')} {
      display: none;
    }
  }
`;

export const AdTeaser = memo<BuilderTeaserProps>(function AdTeaser({ teaser }) {
  const id = useId();
  const cssId = useMemo(() => id.replace(/:/g, ''), [id]);
  const theme = useTheme();
  const [size, showMobile] = useMemo(() => {
    let showMobile = true;
    let size: AdSizeType;

    switch (teaser?.preTitle) {
      case 'ad-970x250': {
        size = [970, 250];
        showMobile = false;
        break;
      }

      case 'ad-728x90': {
        size = [728, 90];
        showMobile = false;
        break;
      }

      case 'ad-320x416': {
        size = [320, 416];
        break;
      }

      case 'ad-320x480': {
        size = [320, 480];
        break;
      }

      case 'ad-300x600': {
        size = [300, 600];
        break;
      }

      case 'ad-300x250':
      default: {
        size = [300, 250];
        break;
      }
    }

    return [size, showMobile];
  }, [teaser?.preTitle]);
  const adStyles = useMemo(
    () => adCss(theme, cssId, showMobile),
    [theme, cssId, showMobile]
  );

  return (
    <>
      <GlobalStyles styles={adStyles} />
      <Ad
        adUnit={`/22170513353`}
        name={cssId}
        size={size}
      />
    </>
  );
});
