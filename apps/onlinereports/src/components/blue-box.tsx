import styled from '@emotion/styled';

export const BlueBox = styled('div')`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing(3)};
  color: ${({ theme }) => theme.palette.secondary.contrastText};
  background-color: ${({ theme }) => theme.palette.secondary.main};
  gap: ${({ theme }) => theme.spacing(1.5)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: ${({ theme }) => theme.spacing(4.5)};
  }

  color: ${({ theme }) => theme.palette.text.secondary};
`;
