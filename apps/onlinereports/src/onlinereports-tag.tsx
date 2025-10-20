import styled from '@emotion/styled';
import { ArticleListWrapper } from '@wepublish/article/website';
import { Tag } from '@wepublish/tag/website';

export const OnlineReportsTag = styled(Tag)`
  ${({ theme }) => theme.breakpoints.up('md')} {
    & > :is(${ArticleListWrapper}) {
      grid-column: 1/13;
    }
  }
`;
