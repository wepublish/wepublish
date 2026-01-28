import { Alert as MuiAlert } from '@mui/material';
import { ComponentProps, PropsWithChildren } from 'react';

export type AlertProps = PropsWithChildren<ComponentProps<typeof MuiAlert>>;

export function Alert({ children, ...props }: AlertProps) {
  return <MuiAlert {...props}>{children}</MuiAlert>;
}
