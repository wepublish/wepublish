import styled from '@emotion/styled';
import {
  Footer as WepFooter,
  FooterPaperWrapper,
} from '@wepublish/navigation/website';

export const Footer = styled(WepFooter)`
  background-color: transparent;
  color: ${({ theme }) => theme.palette.text.primary};

  ${FooterPaperWrapper} {
    background: ${({ theme }) => theme.palette.primary.main};
  }
`;
