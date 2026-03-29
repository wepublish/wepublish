import styled from '@emotion/styled';
import { ContentWrapperStyled } from '@wepublish/content/website';

export const WepContentWrapper = styled(ContentWrapperStyled)`
  row-gap: ${({ theme }) => theme.spacing(15)};
`;
