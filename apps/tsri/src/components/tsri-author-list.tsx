import styled from '@emotion/styled';
import { AuthorList as AuthorListDefault } from '@wepublish/author/website';

export const TsriAuthorList = styled(AuthorListDefault)`
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing(5)};
`;
