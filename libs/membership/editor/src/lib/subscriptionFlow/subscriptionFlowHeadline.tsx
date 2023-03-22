import React from 'react'
import {MdAlarmOn, MdCelebration, MdFilterAlt} from 'react-icons/all'
import {styled, TableCell} from '@mui/material'
import {useTranslation} from 'react-i18next'
import {PermissionControl} from 'app/atoms/permissionControl'

interface SubscriptionFlowHeadlineProps {
  defaultFlowOnly?: boolean
  filterCount: number
  userActionCount: number
  nonUserActionCount: number
}

export default function ({
  defaultFlowOnly,
  filterCount,
  userActionCount,
  nonUserActionCount
}: SubscriptionFlowHeadlineProps) {
  const {t} = useTranslation()
  const DarkTableCell = styled(TableCell)(({theme}) => ({
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
    borderRight: `1px solid ${theme.palette.common.white}`
  }))

  return (
    <>
      {!defaultFlowOnly && (
        <DarkTableCell align="center" colSpan={filterCount}>
          <MdFilterAlt size={20} style={{marginRight: '5px'}} />
          {t('subscriptionFlow.filters')}
        </DarkTableCell>
      )}
      <DarkTableCell align="center" colSpan={userActionCount}>
        <MdCelebration size={20} style={{marginRight: '5px'}} />
        {t('subscriptionFlow.subscriptionEvents')}
      </DarkTableCell>
      <DarkTableCell align="center" colSpan={nonUserActionCount}>
        <MdAlarmOn size={20} style={{marginRight: '5px'}} />
        {t('subscriptionFlow.timeline')}
      </DarkTableCell>
      <PermissionControl
        qualifyingPermissions={['CAN_UPDATE_SUBSCRIPTION_FLOW', 'CAN_DELETE_SUBSCRIPTION_FLOW']}>
        <DarkTableCell align="center">{t('subscriptionFlow.actions')}</DarkTableCell>
      </PermissionControl>
    </>
  )
}
