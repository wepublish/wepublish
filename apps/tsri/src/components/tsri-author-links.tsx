import styled from '@emotion/styled';
import {
  AuthorLink,
  AuthorLinks as AuthorLinksDefault,
} from '@wepublish/author/website';

export const TsriAuthorLinks = styled(AuthorLinksDefault)`
  gap: unset;
  column-gap: ${({ theme }) => theme.spacing(1)};
  justify-self: end;

  padding: 0.25rem 0 0;
  grid-column: 2 / 4;
  grid-row: 3 / 4;

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: 1.25rem 0 0 0;
    grid-column: 3 / 4;
    grid-row: 1 / 3;
  }

  ${AuthorLink} {
    color: ${({ theme }) => theme.palette.common.white};
    background-color: ${({ theme }) => theme.palette.common.black};
    border-radius: 50%;
    padding: 0.45rem;

    &:hover {
      background-color: ${({ theme }) => theme.palette.primary.light};
      color: ${({ theme }) => theme.palette.common.black};
    }

    & > svg {
      width: 1rem;
      height: 1rem;
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      & > svg {
        width: 1.6rem;
        height: 1.6rem;
      }
    }
  }
`;
