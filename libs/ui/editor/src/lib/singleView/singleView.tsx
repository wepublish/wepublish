import { Grid } from '@mui/material';
import { ReactNode } from 'react';

interface SingleViewProps {
  children: ReactNode;
}
export function SingleView({ children }: SingleViewProps) {
  return (
    <Grid
      container
      spacing={2}
    >
      <Grid
        container
        spacing={2}
      >
        <Grid size={{ xs: 12 }}>{children}</Grid>
      </Grid>
    </Grid>
  );
}
