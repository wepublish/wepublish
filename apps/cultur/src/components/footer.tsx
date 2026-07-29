import styled from '@emotion/styled';
import {
  Footer as WepFooter,
  FooterPaperWrapper,
} from '@wepublish/navigation/website';

export const Footer = styled(WepFooter)`
  background-color: transparent;

  ${FooterPaperWrapper} {
    background: ${({ theme }) => theme.palette.primary.main};
    color: ${({ theme }) => theme.palette.text.primary};
  }
`;
