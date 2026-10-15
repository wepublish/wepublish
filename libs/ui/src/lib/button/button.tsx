import { Button as MuiButton } from '@mui/material';
import { ComponentProps, ElementType, PropsWithChildren } from 'react';

type MuiButtonProps = ComponentProps<typeof MuiButton>;

export type ButtonProps = PropsWithChildren<MuiButtonProps> &
  (MuiButtonProps extends { LinkComponent?: ElementType } ? { target?: string }
  : object);

export function Button({
  children,
  variant = 'contained',
  ...props
}: ButtonProps) {
  return (
    <MuiButton
      {...props}
      variant={variant}
    >
      {children}
    </MuiButton>
  );
}
