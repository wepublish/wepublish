import styled from '@emotion/styled';

export const MainGrid = styled('div')`
  display: grid;
  align-items: start;
  grid-template-columns:
    1fr clamp(0px, 100%, ${({ theme }) => theme.breakpoints.values.lg}px)
    1fr;
  grid-template-rows: min-content 1fr min-content;
  min-height: 100vh;
  row-gap: ${({ theme }) => theme.spacing(3)};

  & > * {
    grid-column: 2/3;
  }
`;
