import React from 'react'
import {ListViewContainer, ListViewHeader} from '../../../../../../apps/editor/src/app/ui/listView'
import {Typography} from '@mui/material'

export default function () {
  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <Typography variant="h2">Abo-Einstellungen</Typography>
          <Typography variant="subtitle1">
            Dies sind die Standard-Einstellungen, die Du für jeden Memberplan überschreiben kannst.
          </Typography>
        </ListViewHeader>
      </ListViewContainer>
    </>
  )
}
