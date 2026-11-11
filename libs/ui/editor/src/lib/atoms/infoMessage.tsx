import { Alert } from '@mui/material';
import { ReactNode } from 'react';

export enum InfoColor {
  warning = 'warning',
  error = 'error',
  white = 'info',
}

export interface InfoMessageProps {
  messageType: InfoColor;
  message: ReactNode;
}

export function InfoMessage({
  messageType = InfoColor.white,
  message,
}: InfoMessageProps) {
  return (
    <Alert
      severity={messageType}
      variant="outlined"
      sx={{ py: 0, px: 1 }}
    >
      {message}
    </Alert>
  );
}
