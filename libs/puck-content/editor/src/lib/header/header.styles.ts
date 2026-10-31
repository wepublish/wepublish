import styled from '@emotion/styled';
import { Badge, FormControlLabel } from '@mui/material';

export const PuckHeaderBadge = styled(Badge)`
  .MuiBadge-dot {
    top: 2px;
    right: 2px;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.vars.palette.background.paper};
  }
`;

export const PuckHeaderAutosaveLabel = styled(FormControlLabel)`
  flex-shrink: 0;
  gap: ${({ theme }) => theme.spacing(0.75)};
  margin: 0;
  color: ${({ theme }) => theme.vars.palette.text.secondary};

  .MuiFormControlLabel-label {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
  }
`;
