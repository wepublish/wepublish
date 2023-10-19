import React from 'react'
import {TableCell} from '@mui/material'
import {useTranslation} from 'react-i18next'

interface FilterHeadProps {
  defaultFlowOnly?: boolean
}

export default function ({defaultFlowOnly}: FilterHeadProps) {
  if (defaultFlowOnly) {
    return null
  }
  const {t} = useTranslation()

  return (
    <>
      {/* filter */}
      <TableCell align="center">
        <b>{t('subscriptionFlow.memberplan')}</b>
      </TableCell>
      <TableCell align="center">
        <b>{t('subscriptionFlow.paymentMethod')}</b>
      </TableCell>
      <TableCell align="center">
        <b>{t('subscriptionFlow.periodicity')}</b>
      </TableCell>
      <TableCell align="center">
        <b>{t('subscriptionFlow.autoRenewal')}</b>
      </TableCell>
    </>
  )
}
