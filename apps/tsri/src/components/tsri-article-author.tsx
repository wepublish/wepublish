import styled from '@emotion/styled';
import {
  ArticleAuthor,
  ArticleAuthorImageWrapper,
  ArticleAuthorMetaWrapper,
  ArticleAuthorName,
  AuthorLinksWrapper,
} from '@wepublish/author/website';

export const TsriArticleAuthor = styled(ArticleAuthor)`
  grid-column: -1 / 1;
  grid-template-rows: min-content auto;
  grid-template-columns: subgrid;

  ${ArticleAuthorImageWrapper} {
    margin-left: unset;
    grid-column: 1 / 2;
    width: 110px;

    ${({ theme }) => theme.breakpoints.up('md')} {
      width: 140px;
    }
  }

  ${ArticleAuthorName} {
    font-size: 2rem;
    grid-column: 2 / 3;
    grid-row: 1 / 2;
    width: 100%;
    margin: 0.25rem 0 0 0;
    font-weight: 700;
    font-size: 1rem;

    ${({ theme }) => theme.breakpoints.up('md')} {
      margin: 1.25rem 0 0 0;
    }

    & .MuiTypography-root {
      padding: 0.25rem 0.4rem;

      &:hover {
        background-color: ${({ theme }) => theme.palette.primary.light};
        color: ${({ theme }) => theme.palette.common.black};
      }
    }
  }

  ${ArticleAuthorMetaWrapper} {
    grid-column: -1 / 1;
    padding: 0;

    p {
      font-size: 1rem;
      font-weight: 700;
    }
  }

  ${ArticleAuthorMetaWrapper} + ${ArticleAuthorMetaWrapper} {
    grid-column: 3 / 4;
    grid-row: 1 / 2;
    padding: unset;
    align-items: start;

    padding: 0.5rem 0 0 0;
    max-width: calc(100vw - 110px - 8px - ${({ theme }) => theme.spacing(4)});
    overflow: hidden;

    ${({ theme }) => theme.breakpoints.up('md')} {
      padding: 1.5rem 0 0 0;
      max-width: unset;
      overflow: unset;
    }

    ${AuthorLinksWrapper} {
      justify-content: start;
    }
  }
`;
