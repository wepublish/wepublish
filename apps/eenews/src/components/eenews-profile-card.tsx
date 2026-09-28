import styled from '@emotion/styled';
import { alpha, Typography } from '@mui/material';

export const ProfileCard = styled('section', {
  shouldForwardProp: p => p !== 'alert',
})<{ alert?: boolean }>`
  border: 1px solid
    ${({ theme, alert }) =>
      alert ? theme.palette.error.main : theme.palette.divider};
  background: ${({ theme, alert }) =>
    alert ? theme.palette.error.light : theme.palette.background.paper};
`;

export const ProfileCardHead = styled('div', {
  shouldForwardProp: p => p !== 'alert',
})<{ alert?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px 24px;
  padding: 22px 28px;
  border-bottom: 1px solid
    ${({ theme, alert }) =>
      alert ? alpha(theme.palette.error.main, 0.25) : theme.palette.divider};
  ${({ theme }) => theme.breakpoints.down('sm')} {
    padding: 18px 20px;
  }
`;

export const ProfileCardTitle = styled(Typography, {
  shouldForwardProp: p => p !== 'alert',
})<{ alert?: boolean }>`
  display: inline-flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0;
  color: ${({ theme, alert }) =>
    alert ? theme.palette.error.dark : theme.palette.primary.main};
`;

export const ProfileCardAside = styled(Typography, {
  shouldForwardProp: p => p !== 'alert',
})<{ alert?: boolean }>`
  color: ${({ theme, alert }) =>
    alert ? theme.palette.error.dark : theme.palette.text.secondary};
`;

export const ProfileCardBody = styled('div', {
  shouldForwardProp: p => p !== 'tight',
})<{ tight?: boolean }>`
  padding: ${({ tight }) => (tight ? '4px 28px 12px' : '24px 28px')};
  ${({ theme }) => theme.breakpoints.down('sm')} {
    padding: ${({ tight }) => (tight ? '4px 20px 8px' : '20px')};
  }
`;
