import { Theme } from '@mui/material';

export const paletteColor = (theme: Theme, value: string): string => {
  const resolved = value
    .split('.')
    .reduce<unknown>(
      (step, key) =>
        step && typeof step === 'object' ?
          (step as Record<string, unknown>)[key]
        : undefined,
      theme.vars.palette
    );

  return typeof resolved === 'string' ? resolved : value;
};
