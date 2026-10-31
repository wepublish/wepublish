import styled from '@emotion/styled';
import { Chip } from '@mui/material';

export const FormHiddenPlaceholder = styled(Chip)`
  max-width: 100%;
  border-style: dashed;
`;

export const FormHiddenPlaceholderLabel = styled.span`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing(1)};
  min-width: 0;
`;

export const FormHiddenPlaceholderValue = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: monospace;
`;
