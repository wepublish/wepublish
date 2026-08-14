import styled from '@emotion/styled';
import { AuthorList as AuthorListDefault } from '@wepublish/author/website';

export const ReflektAuthorList = styled(AuthorListDefault)`
  column-gap: ${({ theme }) => theme.spacing(2)};
  grid-template-columns: 1fr;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-template-columns: repeat(2, 1fr);
    column-gap: ${({ theme }) => theme.spacing(1)};
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    column-gap: ${({ theme }) => theme.spacing(4)};
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-template-columns: repeat(3, 1fr);
  }
`;
