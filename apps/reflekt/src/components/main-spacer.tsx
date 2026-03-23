import styled from '@emotion/styled';
import { Container } from '@mui/material';

import { FlexBlockHeroWrapper } from './block-layouts/flex-block-hero';

export const MainSpacer = styled(Container)`
  display: grid;
  gap: ${({ theme }) => theme.spacing(5)};

  main > & {
    padding-top: calc(
      var(--navbar-height) + ${({ theme }) => theme.spacing(3)}
    );
  }

  main > &:has(${FlexBlockHeroWrapper}) {
    padding-top: 0;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: ${({ theme }) => theme.spacing(10)};
  }
`;
