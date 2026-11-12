import styled from '@emotion/styled';
import { ContentWrapperStyled } from '@wepublish/content/website';

import { HeroWrapper } from './hero/hero';
import { LatestNewsWrapper } from './latest-news/latest-news';
import { LogoBandWrapper } from './logo-band/logo-band';
import { NetworkNewsWrapper } from './network-news/network-news';

/** Space between the blocks of a page */
export const blockGap = 'var(--block-gap)';

export const WepContentWrapper = styled(ContentWrapperStyled)`
  --block-gap: ${({ theme }) => theme.spacing(5)};
  row-gap: ${blockGap};

  ${({ theme }) => theme.breakpoints.up('md')} {
    --block-gap: ${({ theme }) => theme.spacing(15)};
  }

  // More room between the blocks of the home page (the page with the hero), as
  // in the design. As a margin above each block instead of a gap, so that a block
  // can sit closer to the one above (e.g. the hero links and the logo band).
  &:has(${HeroWrapper}) {
    --block-gap: 60px;
    row-gap: 0;

    & > * + * {
      margin-top: ${blockGap};
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      --block-gap: 180px;
    }

    ${({ theme }) => theme.breakpoints.up('lg')} {
      --block-gap: 250px;

      // The first block after the hero (which ends with the logo band) is closer
      & > *:has(> ${LogoBandWrapper}) + * {
        margin-top: 180px;
      }
    }

    // The news of the network belong to the news of We.Publish above them
    & > *:has(> ${LatestNewsWrapper}) + *:has(> ${NetworkNewsWrapper}) {
      ${({ theme }) => theme.breakpoints.up('md')} {
        margin-top: 120px;
      }
    }
  }
`;
