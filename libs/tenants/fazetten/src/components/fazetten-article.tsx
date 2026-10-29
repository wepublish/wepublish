import styled from '@emotion/styled';
import { Article } from '@wepublish/article/website';
import { createWithTheme } from '@wepublish/ui';

import { ContentTheme } from '../theme';
import { StyledTeaserSlotsLogoWall } from './teaser-layouts/teaser-slots-logo-wall';

const StyledArticle = styled(Article)`
  ${StyledTeaserSlotsLogoWall} {
    /*grid-column: 2/12;*/
  }
`;

export const FazettenArticle = createWithTheme(StyledArticle, ContentTheme);
