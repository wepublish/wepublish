import styled from '@emotion/styled';
import { Alert } from '@mui/material';

export const FormFieldWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(1)};
  min-width: 0;
`;

export const FormEditorHint = styled(Alert)`
  align-self: stretch;
  padding: ${({ theme }) => theme.spacing(0, 1)};
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
`;
