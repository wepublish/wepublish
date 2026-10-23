import { Typography, TypographyProps } from '@mui/material';

export const PageTitle = (props: TypographyProps<'h2'>) => (
  <Typography
    variant="h2"
    component="h1"
    {...props}
  />
);
