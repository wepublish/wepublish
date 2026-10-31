import styled from '@emotion/styled';
import { Alert } from '@mui/material';

export const FormEditorHint = styled(Alert)`
  align-self: stretch;
  padding: ${({ theme }) => theme.spacing(0, 1)};
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
`;
