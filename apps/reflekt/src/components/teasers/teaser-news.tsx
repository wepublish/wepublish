import styled from '@emotion/styled';
import { hasBlockStyle } from '@wepublish/block-content/website';

import { ReflektBlockStyles } from '../block-styles/reflekt-block-styles';
import { ReflektTeaser, TeaserPreTitleNoContent } from './reflekt-teaser';

export const isTeaserNews =
  hasBlockStyle(ReflektBlockStyles.TeaserNews) ||
  hasBlockStyle(ReflektBlockStyles.TeaserNewsGrid);

export const TeaserNews = styled(ReflektTeaser)`
  ${TeaserPreTitleNoContent} {
    display: none;
  }
`;
