import styled from '@emotion/styled';
import { NavbarContainer } from '@wepublish/navigation/website';

export const MannschaftSpacer = styled('div')`
  display: grid;
  align-items: flex-start;
  grid-template-rows: min-content 1fr min-content;
  gap: ${({ theme }) => theme.spacing(3)};
  min-height: 100vh;
`;

export const MannschaftNavbar = styled(NavbarContainer)`
  grid-column: -1/1;
  z-index: 11;
`;

export const MannschaftButtonLink = styled('a')`
  color: ${({ theme }) => theme.palette.primary.contrastText};
`;
