import React, {ReactNode} from 'react'
import {Col, Grid, Row} from 'rsuite'

interface SingleViewProps {
  children: ReactNode
}
export function SingleView({children}: SingleViewProps) {
  return (
    <Grid fluid style={{width: '100%'}}>
      <Row>
        <Col xs={24}>{children}</Col>
      </Row>
    </Grid>
  )
}
