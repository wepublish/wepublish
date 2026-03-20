import styled from '@emotion/styled';
import { ArticleListWrapper } from '@wepublish/article/website';
import { Tag, TagTitleWrapper } from '@wepublish/tag/website';

export const ReflektTag = styled(Tag)`
  ${({ theme }) => theme.breakpoints.up('md')} {
    padding-top: calc(
      var(--navbar-height) + ${({ theme }) => theme.spacing(3)}
    );

    & > ${TagTitleWrapper} {
      & > * {
        text-align: center;
      }
    }

    & > :is(${ArticleListWrapper}) {
      grid-column: -1/1;
    }
  }
`;
