import styled from '@emotion/styled';
import { AuthorList as AuthorListDefault } from '@wepublish/author/website';

export const TsriAuthorList = styled(AuthorListDefault)`
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing(5)};
  padding-top: calc(var(--navbar-height) / 2);
  column-gap: ${({ theme }) => theme.spacing(3)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    column-gap: ${({ theme }) => theme.spacing(4)};
  }
`;
