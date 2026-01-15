import styled from '@emotion/styled';
import {
  AuthorLink,
  AuthorLinks as AuthorLinksDefault,
} from '@wepublish/author/website';

export const TsriAuthorLinks = styled(AuthorLinksDefault)`
  gap: unset;
  column-gap: ${({ theme }) => theme.spacing(1)};

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
      width: 1.6rem;
      height: 1.6rem;
    }
  }
`;
