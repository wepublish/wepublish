import { Alert } from '@mui/material';
import { ReactNode } from 'react';

/**
 * Kept as an enum so the many `messageType={InfoColor.warning}` call sites read
 * unchanged, but the values are now MUI severities rather than raw colours —
 * the palette (and dark mode) comes from the theme.
 */
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
