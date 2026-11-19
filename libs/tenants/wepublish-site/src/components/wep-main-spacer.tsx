import styled from '@emotion/styled';
import { Container } from '@mui/material';

export const MainSpacer = styled(Container)`
  display: grid;
  gap: ${({ theme }) => theme.spacing(5)};

  main > & {
    padding-top: calc(
      var(--navbar-height) + ${({ theme }) => theme.spacing(3)}
    );
  }

  main > &:has(main) {
    margin-top: -${({ theme }) => theme.spacing(5)};
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: ${({ theme }) => theme.spacing(10)};
  }
`;
