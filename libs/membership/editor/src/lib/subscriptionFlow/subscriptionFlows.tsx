import React, {createContext, useMemo, useState} from 'react'
import {Table, TableBody, TableCell, TableHead, TableRow} from '@mui/material'
import {Button, IconButton, Loader, Message, toaster} from 'rsuite'
import {MdDelete} from 'react-icons/all'
import SubscriptionFlow from './subscriptionFlow'
import {
  FullMailTemplateFragment,
  SubscriptionFlowFragment,
  SubscriptionInterval,
  useMailTemplateQuery,
  useSubscriptionFlowsQuery,
  SubscriptionEvent,
  useDeleteSubscriptionFlowMutation,
  useUpdateSubscriptionIntervalMutation,
  useCreateSubscriptionIntervalMutation,
  useDeleteSubscriptionIntervalMutation
} from '@wepublish/editor/api-v2'
import {useTranslation} from 'react-i18next'
import {ApolloClient, ApolloError, NormalizedCacheObject} from '@apollo/client'
import {GraphqlClientContext} from './graphqlClientContext'
import MailTemplateSelect from './mailTemplateSelect'
import {getApiClientV2} from 'apps/editor/src/app/utility'

/**
 * CONTEXT
 */
export const MailTemplatesContext = createContext<FullMailTemplateFragment[]>([])

/**
 * TYPES
 */
const USER_ACTION_EVENTS = [
  SubscriptionEvent.Subscribe,
  SubscriptionEvent.RenewalSuccess,
  SubscriptionEvent.RenewalFailed,
  SubscriptionEvent.DeactivationByUser,
  SubscriptionEvent.Reactivation
] as const
type UserActionEvents = typeof USER_ACTION_EVENTS[number]

const NON_USER_ACTION_EVENTS = [
  SubscriptionEvent.InvoiceCreation,
  SubscriptionEvent.DeactivationUnpaid,
  SubscriptionEvent.Custom
] as const
type NonUserActionEvents = typeof NON_USER_ACTION_EVENTS[number]

export interface UserActionInterval extends SubscriptionInterval {
  event: UserActionEvents
  daysAwayFromEnding: null
}

export interface NonUserActionInterval extends SubscriptionInterval {
  event: NonUserActionEvents
  daysAwayFromEnding: number
}

export function isNonUserAction(
  subscriptionInterval: SubscriptionInterval
): subscriptionInterval is NonUserActionInterval {
  return NON_USER_ACTION_EVENTS.includes(subscriptionInterval.event as NonUserActionEvents)
}

export function isNonUserEvent(event: SubscriptionEvent): event is NonUserActionEvents {
  return NON_USER_ACTION_EVENTS.includes(event as NonUserActionEvents)
}

export interface DecoratedSubscriptionInterval<T extends SubscriptionInterval> {
  subscriptionFlowId: number
  title: string
  object: T
}

export const showErrors = (error: ApolloError): void => {
  toaster.push(
    <Message type="error" showIcon closable duration={3000}>
      {error.message}
    </Message>
  )
}

interface SubscriptionFlowsProps {
  defaultSubscriptionMode: boolean
}

export default function SubscriptionFlows({defaultSubscriptionMode}: SubscriptionFlowsProps) {
  const {t} = useTranslation()
  const [subscriptionFlows, setSubscriptionFlows] = useState<SubscriptionFlowFragment[]>([])

  const userActionEvents = USER_ACTION_EVENTS.map(eventName => {
    return {
      title: t(`subscriptionFlow.${eventName.toLowerCase()}`),
      description: t(`subscriptionFlow.${eventName.toLowerCase()}Description`),
      subscriptionEventKey: eventName
    }
  })

  /**
   * API SERVICES
   */
  const client: ApolloClient<NormalizedCacheObject> = useMemo(() => getApiClientV2(), [])

  // get subscriptions flows
  const {loading: loadingSubscriptionFlow} = useSubscriptionFlowsQuery({
    variables: {
      defaultFlowOnly: false
    },
    client,
    onError: showErrors,
    onCompleted: data => setSubscriptionFlows(data.SubscriptionFlows)
  })

  // get mail templates
  const {data: mailTemplates, loading: loadingMailTemplates} = useMailTemplateQuery({
    client,
    onError: showErrors
  })

  const [createSubscriptionInterval] = useCreateSubscriptionIntervalMutation({
    client,
    onError: showErrors
  })
  const [updateSubscriptionInterval] = useUpdateSubscriptionIntervalMutation({
    client,
    onError: showErrors
  })
  const [deleteSubscriptionInterval] = useDeleteSubscriptionIntervalMutation({
    client,
    onError: showErrors
  })

  const [deleteSubscriptionFlow] = useDeleteSubscriptionFlowMutation({
    client,
    onError: showErrors
  })

  const subscriptionIntervalFor = function (
    subscriptionFlow: SubscriptionFlowFragment,
    eventName: string
  ): DecoratedSubscriptionInterval<NonUserActionInterval> | undefined {
    const withTitle = subscriptionFlow.intervals.map(i => {
      return {
        title: t(`subscriptionFlow.${i.event.toLowerCase()}`),
        subscriptionFlowId: subscriptionFlow.id,
        object: i
      }
    })
    return withTitle.find(
      i => i.object.event === eventName
    ) as DecoratedSubscriptionInterval<NonUserActionInterval>
  }

  /**
   * loading
   * TODO: implement load indication
   */
  const loading: boolean = useMemo(
    () => loadingSubscriptionFlow || loadingMailTemplates,
    [loadingSubscriptionFlow, loadingMailTemplates]
  )

  if (loading) {
    return <Loader center />
  }

  return (
    <MailTemplatesContext.Provider value={mailTemplates?.mailTemplates || []}>
      <GraphqlClientContext.Provider
        value={{
          createSubscriptionInterval,
          updateSubscriptionInterval,
          deleteSubscriptionInterval
        }}>
        <Table>
          <TableHead>
            <TableRow>
              {/* filter TODO: extract */}
              <TableCell size="small">
                <b>Memberplan</b>
              </TableCell>
              <TableCell size="small">
                <b>Payment Provider</b>
              </TableCell>
              <TableCell size="small">
                <b>Periodicity</b>
              </TableCell>
              <TableCell size="small">
                <b>Auto Renewal?</b>
              </TableCell>

              {/* mail templates only TODO: extract */}
              {userActionEvents.map(userActionEvent => (
                <TableCell key={userActionEvent.subscriptionEventKey} size="small">
                  {userActionEvent.title}
                </TableCell>
              ))}

              {/* individual flow TODO: extract */}
              <TableCell size="small">Individual flow</TableCell>

              {/* actions */}
              <TableCell size="small">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subscriptionFlows.map(subscriptionFlow => (
              <TableRow key={subscriptionFlow.id}>
                {/* filter */}
                <TableCell size="small">{subscriptionFlow.memberPlan?.name}</TableCell>
                <TableCell size="small">
                  {subscriptionFlow.paymentMethods.map(m => m.name).join(', ')}
                </TableCell>
                <TableCell size="small">{subscriptionFlow.periodicities.join(', ')}</TableCell>
                <TableCell size="small">{subscriptionFlow.autoRenewal.join(', ')}</TableCell>

                {/* user actions */}
                {userActionEvents.map(event => (
                  <TableCell size="small" key={event.subscriptionEventKey}>
                    {mailTemplates && mailTemplates.mailTemplates && (
                      <MailTemplateSelect
                        mailTemplates={mailTemplates.mailTemplates}
                        subscriptionInterval={subscriptionIntervalFor(
                          subscriptionFlow,
                          event.subscriptionEventKey
                        )}
                        subscriptionFlow={subscriptionFlow}
                        event={event.subscriptionEventKey}
                      />
                    )}
                  </TableCell>
                ))}

                {/* individual flow */}
                <TableCell size="small">
                  <SubscriptionFlow subscriptionFlow={subscriptionFlow} />
                </TableCell>
                <TableCell align="center" size="small">
                  <IconButton
                    color="red"
                    circle
                    appearance="primary"
                    icon={<MdDelete />}
                    onClick={() =>
                      deleteSubscriptionFlow({variables: {subscriptionFlowId: subscriptionFlow.id}})
                    }
                  />
                  <Button
                    appearance="primary"
                    onClick={() => {
                      createSubscriptionInterval({
                        variables: {
                          subscriptionInterval: {
                            event: SubscriptionEvent.Custom,
                            subscriptionFlowId: subscriptionFlow.id,
                            daysAwayFromEnding: 0
                          }
                        }
                      })
                    }}
                    style={{marginTop: '1em'}}>
                    ADD NEW
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GraphqlClientContext.Provider>
    </MailTemplatesContext.Provider>
  )
}
