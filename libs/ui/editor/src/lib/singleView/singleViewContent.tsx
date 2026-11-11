import { Grid } from '@mui/material';
import { ReactNode } from 'react';

interface SingleViewContentProps {
  children: ReactNode;
}
export function SingleViewContent({ children }: SingleViewContentProps) {
  return (
    <Grid
      container
      spacing={2}
    >
      <Grid size={{ xs: 12 }}>{children}</Grid>
    </Grid>
  );
}
