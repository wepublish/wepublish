import React, {useMemo} from 'react'
import {ListViewContainer, ListViewHeader} from '../../../../../../apps/editor/src/app/ui/listView'
import {TableContainer, Typography} from '@mui/material'
import {MdTune} from 'react-icons/all'
import {
  SubscriptionFlowFragment,
  SubscriptionFlowModel,
  useSubscriptionFlowsQuery
} from '@wepublish/editor/api-v2'
import {useTranslation} from 'react-i18next'
import {getApiClientV2} from '../../../../../../apps/editor/src/app/utility'
import {ApolloError} from '@apollo/client'
import {Message, toaster} from 'rsuite'
import SubscriptionFlows from './subscriptionFlows'

const showErrors = (error: ApolloError): void => {
  toaster.push(
    <Message type="error" showIcon closable duration={3000}>
      {error.message}
    </Message>
  )
}

export default function () {
  const {t} = useTranslation()

  /**
   * API SERVICES
   */
  const client = useMemo(() => getApiClientV2(), [])
  const {data: subscriptionFlows, loading: loadingSubscriptionFlow} = useSubscriptionFlowsQuery({
    variables: {
      defaultFlowOnly: true
    },
    client,
    onError: showErrors
  })

  /**
   * loading
   */
  const loading = useMemo(() => loadingSubscriptionFlow, [loadingSubscriptionFlow])

  const defaultSubscriptionFlow: SubscriptionFlowFragment[] | undefined = useMemo(() => {
    if (!subscriptionFlows) {
      return
    }
    if (!subscriptionFlows.SubscriptionFlows.length) {
      return
    }
    return subscriptionFlows.SubscriptionFlows
  }, [subscriptionFlows])

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
        <SubscriptionFlows subscriptionFlows={defaultSubscriptionFlow} />
      </TableContainer>
    </>
  )
}
