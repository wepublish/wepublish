import React, {useMemo} from 'react'
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
import {SubscriptionFlow, useSubscriptionFlowsQuery} from '@wepublish/editor/api-v2'
import {TFunction, useTranslation} from 'react-i18next'
import {getApiClientV2} from '../../../../../../apps/editor/src/app/utility'
import {ApolloError} from '@apollo/client'
import {Message, toaster} from 'rsuite'

const showErrors = (error: ApolloError): void => {
  toaster.push(
    <Message type="error" showIcon closable duration={3000}>
      {error.message}
    </Message>
  )
}

export interface SubscriptionFlowEvent {
  eventKey: string
  name: string
  description: string
}

export function getSubscriptionFlowEvents(t: TFunction): SubscriptionFlowEvent[] {
  return [
    {
      eventKey: 'subscribe',
      name: t('flowEvent.subscribe'),
      description: t('flowEvent.subscribeDescription')
    }
  ]
}

export default function () {
  const {t} = useTranslation()

  /**
   * API SERVICES
   */
  const client = useMemo(() => getApiClientV2(), [])
  const {data: subscriptionFlows, loading: loadingSubscriptionFlow} = useSubscriptionFlowsQuery({
    client,
    onError: showErrors
  })

  /**
   * loading
   */
  const loading = useMemo(() => loadingSubscriptionFlow, [loadingSubscriptionFlow])

  /**
   * generate data structure for ui
   */
  const defaultSubscriptionFlow: SubscriptionFlow | undefined = useMemo(() => {
    console.log(subscriptionFlows)
    if (!subscriptionFlows) {
      return
    }
    // todo: shorten this endless concatenation
    if (!subscriptionFlows.SubscriptionFlows.subscriptionFlows.length) {
      return
    }
    return subscriptionFlows.SubscriptionFlows.subscriptionFlows[0]
  }, [subscriptionFlows])

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
            <TableRow>
              <TableCell>{t('subscriptionFlowSettings.noDays')}</TableCell>
              <TableCell>{defaultSubscriptionFlow?.subscribe?.name}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}
