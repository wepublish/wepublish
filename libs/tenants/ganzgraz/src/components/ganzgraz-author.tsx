import styled from '@emotion/styled';
import { Author } from '@wepublish/author/website';
import { ImageWrapper } from '@wepublish/image/website';

export const GanzGrazAuthor = styled(Author)`
  ${ImageWrapper} {
    max-height: ${({ theme }) => theme.spacing(40)};
    width: auto;
  }
`;
