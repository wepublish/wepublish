import React from 'react'
import {ListViewContainer, ListViewHeader} from '../../../../../../apps/editor/src/app/ui/listView'
import {TableContainer, Typography} from '@mui/material'
import {MdTune} from 'react-icons/all'
import {useTranslation} from 'react-i18next'
import SubscriptionFlows from './subscriptionFlows'
import {useParams} from 'react-router-dom'

export default function () {
  const {t} = useTranslation()

  const params = useParams()
  const {id: memberPlanId} = params

  const defaultFlowOnly = memberPlanId === 'default'

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
        <SubscriptionFlows defaultFlowOnly={defaultFlowOnly} memberPlanId={memberPlanId} />
      </TableContainer>
    </>
  )
}
