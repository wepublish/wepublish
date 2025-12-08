import styled from '@emotion/styled';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserType } from './tsri-base-teaser';
import { TeaserContentWrapper, TeaserTitle, TsriTeaser } from './tsri-teaser';

export const isTeaserMoreAbout = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === TsriTeaserType.MoreAbout;
  },
]);

export const TeaserMoreAbout = styled(TsriTeaser)`
  aspect-ratio: unset;
  container: unset;
  background-color: transparent;

  & * {
    background-color: transparent;

    & > * {
      display: none;
    }
  }

  ${TeaserContentWrapper} {
    grid-template-rows: unset;
    grid-template-columns: unset;
    border-radius: unset;
    background-color: transparent;
    padding: 7cqw 0 0 0;
  }

  & ${TeaserTitle} {
    @container tabbed-content (width > 200px) {
      font-size: 1.1cqw !important;
      font-weight: 700 !important;
      line-height: 1.2cqw !important;
    }
    text-align: right;
    display: inline-block;
    padding: 0;

    & > * {
      display: inline;
      text-decoration: underline;

      &:hover {
        background-color: #f5ff64;
        color: black;
      }
    }
  }
`;
