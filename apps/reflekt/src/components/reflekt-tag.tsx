import styled from '@emotion/styled';
import { ArticleListWrapper } from '@wepublish/article/website';
import { TeaserGridBlockWrapper } from '@wepublish/block-content/website';
import { Tag, TagTitleWrapper } from '@wepublish/tag/website';

export const ReflektTag = styled(Tag)`
  //padding-top: calc(var(--navbar-height) + ${({ theme }) =>
    theme.spacing(3)});
  row-gap: ${({ theme }) => theme.spacing(3)};

  & > ${TagTitleWrapper} {
    & > * {
      text-align: center;
    }
  }

  & > :is(${ArticleListWrapper}) {
    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-column: -1/1;
    }

    & > :is(${TeaserGridBlockWrapper}) {
      row-gap: ${({ theme }) => theme.spacing(2)};
    }
  }
`;
