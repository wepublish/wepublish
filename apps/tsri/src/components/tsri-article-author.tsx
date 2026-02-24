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
  grid-template-columns: subgrid;
  grid-template-rows: min-content auto;

  ${ArticleAuthorImageWrapper} {
    margin-left: unset;
    width: 140px;
    grid-column: 1 / 2;
  }

  ${ArticleAuthorName} {
    font-size: 2rem;
    grid-column: 2 / 3;
    width: 100%;
    margin: 1.25rem 0 0 0;
    font-weight: 700;
    font-size: 1.5rem;

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
    padding: 1rem 0 0 0;

    p {
      font-size: 1rem;
      font-weight: 400;
    }
  }

  ${ArticleAuthorMetaWrapper} + ${ArticleAuthorMetaWrapper} {
    grid-column: 3 / 4;
    grid-row: 1 / 2;
    padding: unset;
    align-items: start;
    padding: 1.5rem 0 0 0;

    ${AuthorLinksWrapper} {
      justify-content: start;
    }
  }
`;
