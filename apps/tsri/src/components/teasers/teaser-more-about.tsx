import styled from '@emotion/styled';
import { createWithTheme } from '@wepublish/ui';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { teaserMoreAboutTheme } from '../../theme';
import { StyledTeaserTopicMeta } from './teaser-topic-meta';
import { TsriTeaserType } from './tsri-base-teaser';
import { TeaserContentWrapper, TeaserLead, TeaserTitle } from './tsri-teaser';

export const isTeaserMoreAbout = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === TsriTeaserType.MoreAbout;
  },
]);

export const StyledTeaserMoreAbout = styled(StyledTeaserTopicMeta)`
  ${TeaserContentWrapper} {
    grid-template-rows: unset;
    padding-top: 7cqw;
    padding-bottom: 2cqw;

    ${({ theme }) => theme.breakpoints.up('md')} {
      padding-bottom: 0;
    }
  }

  & ${TeaserTitle} {
    display: none;
  }

  & ${TeaserLead} {
    display: none;
  }
`;

export const TeaserMoreAbout = createWithTheme(
  StyledTeaserMoreAbout,
  teaserMoreAboutTheme
);
