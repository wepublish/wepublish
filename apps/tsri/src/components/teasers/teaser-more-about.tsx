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
  cursor: default;

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
    padding-top: 7cqw;
  }

  & ${TeaserTitle} {
    font-size: 1.1cqw !important;
    font-weight: 700 !important;
    line-height: 1.2cqw !important;
    text-align: right;
    display: inline-block;
    padding: 0;

    & .MuiLink-root {
      &:after {
        content: '';
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: transparent;
        cursor: pointer;
      }
    }

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
