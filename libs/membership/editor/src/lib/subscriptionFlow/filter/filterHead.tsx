import React from 'react'
import {TableCell} from '@mui/material'

interface FilterHeadProps {
  defaultFlowOnly?: boolean
}

export default function ({defaultFlowOnly}: FilterHeadProps) {
  if (defaultFlowOnly) {
    return null
  }
  return (
    <>
      {/* filter */}
      <TableCell align="center">
        <b>Memberplan</b>
      </TableCell>
      <TableCell align="center">
        <b>Payment Method</b>
      </TableCell>
      <TableCell align="center">
        <b>Periodicity</b>
      </TableCell>
      <TableCell align="center">
        <b>Auto Renewal?</b>
      </TableCell>
    </>
  )
}
