import styled from '@emotion/styled';
import {
  FooterContainer,
  FooterPaperWrapper,
  NavbarContainer,
} from '@wepublish/navigation/website';

export const BabanewsContentSpacer = styled('div')`
  min-height: 100vh;
`;

export const BabanewsFooter = styled(FooterContainer)`
  grid-column: -1/1;

  ${FooterPaperWrapper} {
    color: ${({ theme }) => theme.palette.common.white};
  }
`;

export const BabanewsNavBar = styled(NavbarContainer)`
  grid-column: -1/1;
  z-index: 11;
`;
