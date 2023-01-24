import React, {ReactNode} from 'react'
import {Grid} from '@mui/material'

interface SingleViewContentProps {
  children: ReactNode
}
export function SingleViewContent({children}: SingleViewContentProps) {
  return (
    <Grid container>
      <Grid xs={12}>{children}</Grid>
    </Grid>
  )
}
