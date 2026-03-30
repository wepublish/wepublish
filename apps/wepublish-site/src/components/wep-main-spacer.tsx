import styled from '@emotion/styled';
import { Container } from '@mui/material';
import { YouTubeVideoBlockWrapper } from '@wepublish/block-content/website';

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

  &:has(${YouTubeVideoBlockWrapper}) {
    margin-top: -${({ theme }) => theme.spacing(11)};
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: ${({ theme }) => theme.spacing(10)};
  }
`;
