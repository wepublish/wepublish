import React from 'react'
import {ListViewContainer, ListViewHeader} from '../../../../../../apps/editor/src/app/ui/listView'
import {
  TableContainer,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Paper
} from '@mui/material'

export default function () {
  // todo: continue with fetching SubscriptionCommunicationFlow

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <Typography variant="h2">Abo-Einstellungen</Typography>
          <Typography variant="subtitle1">
            Du kannst diese Einstellungen für jeden Memberplan überschreiben.
          </Typography>
        </ListViewHeader>
      </ListViewContainer>

      <TableContainer style={{marginTop: '16px'}}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <b>Tage bis zur Abo-Erneuerung</b>
              </TableCell>
              <TableCell>
                <b>Aktion</b>
              </TableCell>
              <TableCell>
                <b>Standard-Mail</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow></TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}
