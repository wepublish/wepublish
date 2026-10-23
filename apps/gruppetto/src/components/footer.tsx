import styled from '@emotion/styled';
import { Footer as WepFooter } from '@wepublish/navigation/website';

export const Footer = styled(WepFooter)`
  background-color: transparent;
  color: ${({ theme }) => theme.palette.text.primary};
`;
