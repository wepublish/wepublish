import styled from '@emotion/styled';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { ReflektBlockType } from '../block-styles/reflekt-block-styles';
import { ReflektTeaser } from './reflekt-teaser';

export const isTeaserNews = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === ReflektBlockType.TeaserNews;
  },
]);

export const TeaserNews = styled(ReflektTeaser)``;
