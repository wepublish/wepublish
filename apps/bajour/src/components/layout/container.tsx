import styled from '@emotion/styled';

export const Container = styled('main')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(8)};
  padding-left: ${({ theme }) => theme.spacing(2)};
  padding-right: ${({ theme }) => theme.spacing(2)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: 0;
  }
`;
