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
import {
  MailTemplateRef,
  SubscriptionFlowModel,
  useSubscriptionFlowsQuery
} from '@wepublish/editor/api-v2'
import {useTranslation} from 'react-i18next'
import {getApiClientV2} from '../../../../../../apps/editor/src/app/utility'
import {ApolloError} from '@apollo/client'
import {Message, SelectPicker, Tag, toaster} from 'rsuite'

const showErrors = (error: ApolloError): void => {
  toaster.push(
    <Message type="error" showIcon closable duration={3000}>
      {error.message}
    </Message>
  )
}

export type SubscriptionEventKey = keyof Pick<SubscriptionFlowModel, 'subscribeMailTemplate'>

export interface subscriptionEvent {
  subscriptionEventKey: SubscriptionEventKey
  eventName: string
  description: string
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
  const defaultSubscriptionFlow: SubscriptionFlowModel | undefined = useMemo(() => {
    if (!subscriptionFlows) {
      return
    }
    if (!subscriptionFlows.SubscriptionFlows.length) {
      return
    }
    return subscriptionFlows.SubscriptionFlows[0]
  }, [subscriptionFlows])

  const subscriptionEvents: subscriptionEvent[] = [
    {
      subscriptionEventKey: 'subscribeMailTemplate',
      eventName: t('flowEvent.subscribe'),
      description: t('flowEvent.subscribeDescription')
    }
  ]

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
            {/* EVENTS WITHOUT ANY TIME SPECIFICATION */}
            {/* SUBSCRIBE */}
            <TableRow>
              <TableCell>{t('subscriptionFlowSettings.noDays')}</TableCell>
              <TableCell>
                <Tag color="green" size="lg">
                  {subscriptionEvents[0].eventName}
                </Tag>
              </TableCell>
              <TableCell>
                <SelectPicker data={[]} />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}
