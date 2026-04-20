import styled from '@emotion/styled';
import { hasBlockStyle } from '@wepublish/block-content/website';

import { ReflektBlockType } from '../block-styles/reflekt-block-styles';
import { ReflektTeaser, TeaserPreTitleNoContent } from './reflekt-teaser';

export const isTeaserNews =
  hasBlockStyle(ReflektBlockType.TeaserNews) ||
  hasBlockStyle(ReflektBlockType.TeaserNewsGrid);

export const TeaserNews = styled(ReflektTeaser)`
  ${TeaserPreTitleNoContent} {
    display: none;
  }
`;
