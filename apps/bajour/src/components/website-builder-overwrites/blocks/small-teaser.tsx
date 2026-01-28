import styled from '@emotion/styled';
import {
  hasBlockStyle,
  isTeaserGridBlock,
  isTeaserListBlock,
} from '@wepublish/block-content/website';
import {
  BlockContent,
  TeaserGridBlock,
  TeaserListBlock,
} from '@wepublish/website/api';
import { allPass, anyPass } from 'ramda';

import { TeaserOverwrite } from './teaser-overwrite';
import {
  fluidTypography,
  TeaserContentStyled,
  TeaserImgStyled,
  TeaserLeadStyled,
  TeaserTitlesStyled,
  TextLine,
} from './teaser-overwrite.style';

export const isSmallTeaser = (
  block: Pick<BlockContent, '__typename'>
): block is TeaserGridBlock | TeaserListBlock =>
  allPass([
    hasBlockStyle('Kleine Teaser'),
    anyPass([isTeaserGridBlock, isTeaserListBlock]),
  ])(block);

export const SmallTeaser = styled(TeaserOverwrite)`
  gap: ${({ theme }) => theme.spacing(1.5)};
  grid-column: 2/12;
  grid-auto-rows: auto;

  ${TeaserContentStyled} {
    grid-column: span 18;
  }

  ${TextLine} {
    grid-column: 7/25;
    height: 2px;
    margin-left: ${({ theme }) => theme.spacing(0.5)};
    margin-right: ${({ theme }) => theme.spacing(0.5)};
    margin-top: -${({ theme }) => theme.spacing(2)};
  }

  ${TeaserImgStyled} {
    grid-column: span 6;
    aspect-ratio: 1;
  }

  ${TeaserTitlesStyled},
  ${TeaserLeadStyled} {
    font-size: ${fluidTypography(12, 20)};
  }

  ${TeaserTitlesStyled} {
    font-weight: bold;
  }

  ${TeaserLeadStyled} {
    font-weight: 300;
  }

  ${({ theme }) => theme.breakpoints.up('sm')} {
    gap: ${({ theme }) => theme.spacing(2)};
    grid-column: span 6;

    ${TeaserContentStyled} {
      grid-column: span 8;
    }

    ${TeaserImgStyled} {
      grid-column: span 4;
      aspect-ratio: 1;
    }

    ${TextLine} {
      grid-column: 5/13;
    }
  }
`;
