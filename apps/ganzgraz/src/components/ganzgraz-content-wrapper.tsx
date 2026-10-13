import styled from '@emotion/styled';
import { ContentWrapperStyled } from '@wepublish/content/website';
import { BuilderContentWrapperProps } from '@wepublish/website/builder';

export const GanzGrazContentWrapper = styled(
  ContentWrapperStyled
)<BuilderContentWrapperProps>`
  row-gap: ${({ theme }) => theme.spacing(3)};
`;
