import styled from '@emotion/styled';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { recife } from '../../theme';
import { ReflektBlockType } from '../block-styles/reflekt-block-styles';
import {
  ReflektTeaser,
  TeaserContentWrapper,
  TeaserLead,
  TeaserMetadata,
  TeaserPreTitleNoContent,
  TeaserTitle,
} from './reflekt-teaser';

export const isTeaserCredits = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === ReflektBlockType.TeaserCredits;
  },
]);

export const TeaserCredits = styled(ReflektTeaser)`
  aspect-ratio: unset;
  grid-template-rows: repeat(2, min-content);
  row-gap: 0;
  cursor: default;

  & ${TeaserPreTitleNoContent} {
    display: none;
  }

  & ${TeaserMetadata} {
    display: none;
  }

  & ${TeaserContentWrapper} {
    background-color: transparent;
    color: ${({ theme }) => theme.palette.common.black};
    display: contents;

    &:hover {
      background-color: transparent;
    }
  }

  & ${TeaserTitle} {
    grid-row: 1 / 2;
    font-family: ${recife.style.fontFamily};
    font-size: 1.125rem;
    line-height: 1.25;
    text-align: center;
  }

  & ${TeaserLead} {
    color: ${({ theme }) => theme.palette.common.black};
    text-align: center;
    font-size: 1.125rem;
    line-height: 1.25;
    grid-row: 2 / 3;
    margin: 0;
  }
`;
