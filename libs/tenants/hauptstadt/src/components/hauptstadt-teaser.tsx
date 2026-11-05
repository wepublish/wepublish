import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Theme } from '@mui/material';
import {
  AlternatingTeaser,
  BaseTeaser,
  FocusedTeaser,
  FocusTeaser,
  TeaserAuthors,
  TeaserContentWrapper,
  TeaserGridBlock,
  TeaserImage,
  TeaserImageWrapper,
  TeaserLead,
  TeaserListBlock,
  TeaserListBlockTeasers,
  TeaserPreTitle,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper,
  TeaserSlider,
  TeaserSlotsBlock,
  TeaserSlotsBlockTeasers,
  TeaserUpdateTime,
  TeaserWrapper,
} from '@wepublish/block-content/website';
import { ImageWrapper } from '@wepublish/image/website';
import { createWithTheme } from '@wepublish/ui';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { memo } from 'react';

import { alternatingTeaserTheme } from '../theme';
import { CurrentPaywallContext } from './hauptstadt-paywall';
import { HauptstadtTeaserPreTitle } from './hauptstadt-premium-indicator';

const teaserGaps = ({ theme }: { theme: Theme }) => css`
  padding-bottom: var(--page-content-row-gap);
  column-gap: ${theme.spacing(1.5)};

  ${theme.breakpoints.up('md')} {
    column-gap: ${theme.spacing(2.5)};
  }

  ${theme.breakpoints.up('lg')} {
    column-gap: ${theme.spacing(5)};
  }

  ${theme.breakpoints.up('xxl')} {
    column-gap: ${theme.spacing(7.5)};
  }
`;

export const HauptstadtTeaserGrid = styled(TeaserGridBlock)`
  align-items: stretch; // Makes all teasers the same height
  row-gap: var(--page-content-row-gap);
  column-gap: var(--content-column-gap);

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-template-columns: 1fr;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(3, 1fr);
  }

  // Ignore TeaserWrapper layout and follow parent columns
  ${TeaserWrapper} {
    grid-column: unset;
    grid-row: unset;

    &:only-child {
      grid-column-start: 2;
    }
  }
`;

export const HauptstadtTeaserList = styled(TeaserListBlock)`
  ${TeaserListBlockTeasers} {
    align-items: stretch; // Makes all teasers the same height
    row-gap: var(--page-content-row-gap);
    column-gap: var(--content-column-gap);

    ${({ theme }) => theme.breakpoints.up('sm')} {
      grid-template-columns: 1fr;
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-template-columns: repeat(12, 1fr);
    }
  }
`;

export const HauptstadtTeaserSlots = styled(TeaserSlotsBlock)`
  ${TeaserSlotsBlockTeasers} {
    align-items: stretch; // Makes all teasers the same height
    row-gap: var(--page-content-row-gap);
    column-gap: var(--content-column-gap);

    ${({ theme }) => theme.breakpoints.up('sm')} {
      grid-template-columns: 1fr;
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-template-columns: repeat(12, 1fr);
    }
  }
`;

const revertTeaserToDefault = ({ theme }: { theme: Theme }) => css`
  grid-template-areas:
    'image'
    'pretitle'
    'title'
    'lead'
    'authors';
  grid-template-rows: initial;
  grid-template-columns: initial;

  ${TeaserImageWrapper} {
    padding-bottom: ${theme.spacing(1.5)};
    align-items: center;
  }
`;

const TeaserWithPaywall = memo<BuilderTeaserProps>(function WithPaywall(props) {
  return (
    <CurrentPaywallContext.Provider
      value={
        props.teaser?.__typename === 'ArticleTeaser' ?
          props.teaser.article?.paywall
        : null
      }
    >
      <BaseTeaser
        {...props}
        PreTitle={HauptstadtTeaserPreTitle}
      />
    </CurrentPaywallContext.Provider>
  );
});

export const HauptstadtTeaser = styled(TeaserWithPaywall)`
  border-bottom: 1px solid ${({ theme }) => theme.palette.primary.main};
  grid-template-rows: repeat(5, minmax(0, auto));
  grid-template-areas:
    'image .'
    'image pretitle'
    'image title'
    'image authors'
    'image .';
  grid-template-columns: 1fr 2fr;
  ${teaserGaps}

  ${TeaserImageWrapper} {
    margin-bottom: 0;
    padding-bottom: 0;
    display: grid;
    align-items: start;
  }

  ${TeaserImage} {
    aspect-ratio: 3/2;
    max-height: unset;
  }

  ${TeaserPreTitleNoContent} {
    grid-area: pretitle;
    // Setting it to 0px instead of "display: none" allows the grid-area to properly size
    // And makes the teaser content properly aligned when there's no pre title
    height: 0px;
    margin: 0px;
  }

  &:hover ${TeaserPreTitle} {
    color: ${({ theme }) => theme.palette.accent.contrastText};
    background-color: ${({ theme }) => theme.palette.accent.main};
  }

  &:hover ${ImageWrapper} {
    transform: unset;
  }

  ${TeaserPreTitleWrapper} {
    height: auto;
    width: max-content;
  }

  ${TeaserAuthors} {
    font-weight: 400;
  }

  ${TeaserLead} {
    display: none;
  }

  ${TeaserUpdateTime} {
    display: initial;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    ${revertTeaserToDefault}

    ${TeaserLead} {
      display: block;
    }
  }
`;

export const HauptstadtAlternatingTeaser = createWithTheme(
  styled(AlternatingTeaser)`
    ${revertTeaserToDefault}

    ${TeaserPreTitleNoContent} {
      // Setting it to 0px instead of "display: none" allows the grid-area to properly size
      // And makes the teaser content properly aligned when there's no pre title
      height: 0px;
      margin: 0px;
    }

    // Small teasers have lead hidden on mobile
    // We do not want that for the alternating teaser
    ${TeaserLead} {
      display: initial;
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      ${TeaserImageWrapper} {
        margin-bottom: 0;
        padding-bottom: 0;
      }
    }
  `,
  alternatingTeaserTheme
);

export const HauptstadtFocusTeaser = styled(FocusTeaser)`
  ${TeaserListBlockTeasers} {
    align-items: stretch; // Makes all teasers the same height
    gap: ${({ theme }) => theme.spacing(6)};

    ${({ theme }) => theme.breakpoints.up('sm')} {
      grid-template-columns: 1fr;
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }

  // Ignore TeaserWrapper layout and follow parent columns
  ${TeaserWrapper} {
    grid-column: unset;
    grid-row: unset;
  }

  ${FocusedTeaser} {
    // We do not want the border for the focused teaser
    ${TeaserContentWrapper} {
      border-bottom: unset;
      padding-bottom: unset;
    }

    ${TeaserContentWrapper} {
      ${revertTeaserToDefault}
    }

    // Small teasers have lead hidden on mobile
    // We do not want that for the alternating teaser
    ${TeaserLead} {
      display: initial;
    }
  }

  // Pretitle background is the same as the FocusTeaser background
  ${TeaserPreTitle},
  &:hover ${TeaserPreTitle} {
    color: ${({ theme }) => theme.palette.primary.contrastText};
    background-color: ${({ theme }) => theme.palette.primary.main};
  }
`;

export const HauptstadtTeaserSlider = styled(TeaserSlider)`
  ${TeaserContentWrapper} {
    ${revertTeaserToDefault}
  }

  .keen-slider__slide {
    // Makes all teasers the same height
    display: grid;
    align-items: stretch;
  }
`;
