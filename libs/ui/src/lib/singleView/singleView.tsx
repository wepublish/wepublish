import React, {ReactNode} from 'react'
import {Grid} from '@mui/material'

interface SingleViewProps {
  children: ReactNode
}
export function SingleView({children}: SingleViewProps) {
  return (
    <Grid container>
      <Grid xs={12}>{children}</Grid>
    </Grid>
  )
}
