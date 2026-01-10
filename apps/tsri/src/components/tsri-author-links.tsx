import styled from '@emotion/styled';
import {
  AuthorLink,
  AuthorLinks as AuthorLinksDefault,
} from '@wepublish/author/website';

export const TsriAuthorLinks = styled(AuthorLinksDefault)`
  gap: unset;
  column-gap: ${({ theme }) => theme.spacing(1)};

  ${AuthorLink} {
    color: white;
    background-color: black;
    border-radius: 50%;
    padding: 0.25rem;

    &:hover {
      background-color: #f5ff64;
      color: black;
    }

    & > svg {
      width: 2rem;
      height: 2rem;
    }
  }
`;
