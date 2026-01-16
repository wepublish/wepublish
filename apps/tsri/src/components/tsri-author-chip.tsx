import styled from '@emotion/styled';
import {
  AuthorChip,
  AuthorChipContent,
  AuthorChipImageWrapper,
  AuthorChipJob,
  AuthorChipName,
} from '@wepublish/author/website';

export const TsriAuthorChip = styled(AuthorChip)`
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

  ${AuthorChipImageWrapper} {
    margin-left: unset;
    width: 80px;
    grid-column: 1 / 2;

    ${({ theme }) => theme.breakpoints.up('md')} {
      width: 140px;
    }
  }

  ${AuthorChipContent} {
    padding: 0.7rem 0 0 0;
    align-items: start;
    row-gap: 2rem;
    display: grid;

    ${({ theme }) => theme.breakpoints.up('md')} {
      display: flex;
      padding: 1rem 0 0 0;
      row-gap: unset;
    }

    & > div {
      display: flex;
      flex-direction: row;
      gap: 0.2rem;

      font-size: 0.7rem;
      font-weight: 700;

      ${({ theme }) => theme.breakpoints.up('md')} {
        font-size: 1rem;
        gap: 0.5rem;
      }

      ${AuthorChipName} {
        position: relative;
        font-weight: 700;

        &:after {
          content: ',';
          position: absolute;
          bottom: 0;
          right: 0;
          width: 0.2rem;
          height: 100%;
        }

        & .MuiTypography-root {
          padding: 0.2rem 0.2rem;
          color: ${({ theme }) => theme.palette.common.black};
          text-decoration: underline;

          &:hover {
            background-color: ${({ theme }) => theme.palette.primary.light};
            color: ${({ theme }) => theme.palette.common.black};
            text-decoration: none;
          }
        }
      }

      ${AuthorChipJob} {
        padding-left: 0;
      }
    }
  }
`;
