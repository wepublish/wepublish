import styled from '@emotion/styled';
import {
  selectTeaserTitle,
  TeaserLead,
  TeaserPreTitle,
  TeaserPreTitleNoContent,
  TeaserTitle,
} from '@wepublish/block-content/website';
import { BuilderTeaserProps } from '@wepublish/website/builder';

import { OnlineReportsBaseTeaser } from '../onlinereports-base-teaser';

const teaserTitleIsLongOrHasLongWords = (
  teaser: BuilderTeaserProps['teaser']
) => {
  if (!teaser) {
    return false;
  }
  const title = selectTeaserTitle(teaser);
  if (!title) {
    return false;
  }
  if (title.length > 50) {
    return true;
  }
  if (title.split(/\s+/).some(word => word.length >= 10)) {
    return true;
  }
  return false;
};

export const HighlightTeaser = styled(
  OnlineReportsBaseTeaser
)<BuilderTeaserProps>`
  grid-column: span 3;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-column: span 3;
  }

  grid-template-areas:
    'image'
    'pretitle'
    'title'
    'lead'
    'authors'
    '.';
  grid-auto-rows: auto;
  grid-template-columns: 1fr;
  column-gap: ${({ theme }) => theme.spacing(2.5)};
  row-gap: ${({ theme }) => theme.spacing(1)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-areas:
      'image image .'
      'image image pretitle'
      'image image title'
      'image image lead'
      'image image authors'
      'image image tags'
      'image image .';
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: auto auto auto auto auto auto;
  }

  ${TeaserPreTitleNoContent} {
    display: none;
  }

  ${TeaserPreTitle} {
    transform: unset;
    margin-bottom: -10px;
  }

  ${TeaserTitle} {
    font-family: ${({ theme }) => theme.typography.h1.fontFamily};
    font-weight: ${({ theme }) => theme.typography.h1.fontWeight};
    font-size: ${({ theme, teaser }) =>
      teaserTitleIsLongOrHasLongWords(teaser) ?
        theme.typography.h2.fontSize
      : theme.typography.h1.fontSize};

    ${({ theme }) => theme.breakpoints.up('md')} {
      font-size: ${({ theme, teaser }) =>
        teaserTitleIsLongOrHasLongWords(teaser) ? '36px' : '44px'};
    }
  }

  ${TeaserLead} {
    &.MuiTypography-gutterBottom,
    & {
      margin-bottom: 0;
    }
  }

  ${TeaserLead} {
    display: block;
  }
`;
