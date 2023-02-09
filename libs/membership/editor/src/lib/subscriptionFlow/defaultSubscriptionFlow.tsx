import React from 'react'
import {ListViewContainer, ListViewHeader} from '../../../../../../apps/editor/src/app/ui/listView'
import {TableContainer, Typography} from '@mui/material'
import {MdTune} from 'react-icons/all'
import {useTranslation} from 'react-i18next'
import SubscriptionFlows from './subscriptionFlows'

export default function () {
  const {t} = useTranslation()

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>
            <MdTune />
            Standard Abo-Einstellungen
          </h2>
          <Typography variant="subtitle1">
            Du kannst diese Einstellungen für jeden Memberplan überschreiben.
          </Typography>
        </ListViewHeader>
      </ListViewContainer>

      <TableContainer style={{marginTop: '16px'}}>
        <SubscriptionFlows defaultSubscriptionMode />
      </TableContainer>
    </>
  )
}
