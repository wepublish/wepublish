import React from 'react'
import {ListViewContainer, ListViewHeader} from '../../../../../../apps/editor/src/app/ui/listView'
import {
  TableContainer,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow
} from '@mui/material'
import {MdTune} from 'react-icons/all'

export default function () {
  // todo: continue with fetching SubscriptionCommunicationFlow

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>
            <MdTune /> Abo-Einstellungen
          </h2>
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
