import styled from '@emotion/styled';
import { Container, css } from '@mui/material';
import { NavbarContainer, NavbarLink } from '@wepublish/navigation/website';

import background from '../assets/background.svg';
import { staticImageSrc } from '../assets/static-image';

export const GruppettoSpacer = styled('div')`
  display: grid;
  align-items: flex-start;
  grid-template-rows: min-content 1fr min-content;
  gap: ${({ theme }) => theme.spacing(3)};
  min-height: 100vh;
  background: url('${staticImageSrc(background)}');
  background-repeat: repeat-y;
  background-size: cover;
`;

export const GruppettoMainSpacer = styled(Container)`
  display: grid;
  gap: ${({ theme }) => theme.spacing(5)};

  ${({ theme }) => css`
    ${theme.breakpoints.up('md')} {
      gap: ${theme.spacing(10)};
    }
  `}
`;

export const GruppettoNavBar = styled(NavbarContainer)`
  grid-column: -1/1;
  z-index: 11;

  ${NavbarLink}:nth-child(n+3) {
    display: none;
  }
`;
