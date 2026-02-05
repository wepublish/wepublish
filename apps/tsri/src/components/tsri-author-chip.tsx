import styled from '@emotion/styled';
import {
  AuthorChip,
  AuthorChipContent,
  AuthorChipImageWrapper,
  AuthorChipJob,
  AuthorChipName,
} from '@wepublish/author/website';

export const TsriAuthorChip = styled(AuthorChip)`
  /*
  display: grid;
  grid-column: -1 / 1;
  grid-template-columns: subgrid;
  grid-template-rows: min-content;
  padding-bottom: 0;
  border-bottom: none;
  align-items: start;
  &:first-of-type {
    grid-row: 1 / 2;
  }
    */

  display: contents;

  ${AuthorChipImageWrapper} {
    margin-left: unset;
    width: 80px;
    grid-column: 1 / 2;
    grid-row: 1 / 4;

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-row: 1 / 5;
      width: 140px;
    }
  }

  ${AuthorChipContent} {
    padding: 0.7rem 0 0 0;
    display: contents;

    ${({ theme }) => theme.breakpoints.up('md')} {
      padding: 1rem 0 0 0;
    }

    & > div {
      padding: 0.2rem 0 0 0;
      grid-column: 2 / 4;
      grid-row: 1 / 2;
      display: block;
      font-size: 0.7rem;
      font-weight: 700;

      ${({ theme }) => theme.breakpoints.up('md')} {
        grid-column: 2 / 3;
        padding: 1.25rem 0 0 0;
        font-size: 1rem;
        gap: 0.5rem;
      }

      ${AuthorChipName} {
        font-weight: 700;
        display: contents;

        & .MuiTypography-root {
          color: ${({ theme }) => theme.palette.common.black};
          text-decoration: underline;
          display: unset;
          padding: 0 0.2rem;
          margin: 0 0.4rem 0 0;
          position: relative;

          &:after {
            content: ',';
            position: absolute;
            bottom: 0;
            right: 0;
            width: 0.2rem;
            height: 100%;
          }

          &:hover {
            background-color: ${({ theme }) => theme.palette.primary.light};
            color: ${({ theme }) => theme.palette.common.black};
            text-decoration: none;
          }
        }
      }

      ${AuthorChipJob} {
        padding-left: 0;
        display: contents;
      }
    }
  }
`;
