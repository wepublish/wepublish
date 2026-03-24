import styled from '@emotion/styled';
import { AuthorList as AuthorListDefault } from '@wepublish/author/website';

export const ReflektAuthorList = styled(AuthorListDefault)`
  column-gap: ${({ theme }) => theme.spacing(2)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    column-gap: ${({ theme }) => theme.spacing(4)};
  }
`;
