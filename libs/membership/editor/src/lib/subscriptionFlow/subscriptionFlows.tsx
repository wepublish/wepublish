import React, {createContext, useContext, useMemo, useState} from 'react'
import {Table, TableBody, TableCell, TableHead, TableRow} from '@mui/material'
import {IconButton, Message, toaster} from 'rsuite'
import {MdDelete} from 'react-icons/all'
import SubscriptionFlow from './subscriptionFlow'
import {
  FullMailTemplateFragment,
  SubscriptionFlowFragment,
  SubscriptionInterval,
  useMailTemplateQuery,
  useSubscriptionFlowsQuery,
  SubscriptionEvent,
  useDeleteSubscriptionFlowMutation
} from '@wepublish/editor/api-v2'
import {useTranslation} from 'react-i18next'
import {ApolloError} from '@apollo/client'
import {GraphqlClientContext} from './graphqlClientContext'
import MailTemplateSelect from './mailTemplateSelect'

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
]
type UserActionEvents = typeof USER_ACTION_EVENTS[number]

const NON_USER_ACTION_EVENTS = [
  SubscriptionEvent.InvoiceCreation,
  SubscriptionEvent.DeactivationUnpaid,
  SubscriptionEvent.Custom
]
type NonUserActionEvents = typeof NON_USER_ACTION_EVENTS[number]

export type UserActionEvent = Extract<SubscriptionInterval['event'], UserActionEvents>
export type NonUserActionEvent = Extract<SubscriptionInterval['event'], NonUserActionEvents>

export interface UserActionInterval extends SubscriptionInterval {
  event: UserActionEvents
  daysAwayFromEnding?: number | null
  // TODO: make null
}

export interface NonUserActionInterval extends SubscriptionInterval {
  event: NonUserActionEvents
  daysAwayFromEnding?: number | null
}

export function isNonUserAction(
  subscriptionInterval: UserActionInterval | NonUserActionInterval
): subscriptionInterval is NonUserActionInterval {
  return NON_USER_ACTION_EVENTS.indexOf(subscriptionInterval.event) >= 0
}

export interface SubEvent {
  title: string
  description: string
  subscriptionEventKey: SubscriptionEvent
}

export interface SubscriptionIntervalWithTitle extends SubscriptionInterval {
  subscriptionFlowId: number
  title: string
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

  const userActionEvents: SubEvent[] = USER_ACTION_EVENTS.map(eventName => {
    return {
      title: t(`subscriptionFlow.${eventName.toLowerCase()}`),
      description: t(`subscriptionFlow.${eventName.toLowerCase()}Description`),
      subscriptionEventKey: eventName
    }
  })

  /**
   * API SERVICES
   */
  const client = useContext(GraphqlClientContext)

  // get subscriptions flows
  const {loading: loadingSubscriptionFlow, refetch} = useSubscriptionFlowsQuery({
    variables: {
      defaultFlowOnly: defaultSubscriptionMode
    },
    client,
    onError: showErrors,
    onCompleted: data => setSubscriptionFlows(data.SubscriptionFlows)
  })

  const [deleteSubscriptionFlow, {loading: deletionLoading}] = useDeleteSubscriptionFlowMutation({
    client,
    onError: showErrors
  })

  // get mail templates
  const {data: mailTemplates, loading: loadingMailTemplates} = useMailTemplateQuery({
    client,
    onError: showErrors
  })

  const subscriptionIntervalFor = function (
    subscriptionFlow: SubscriptionFlowFragment,
    eventName: string
  ): SubscriptionIntervalWithTitle | undefined {
    const withTitle = subscriptionFlow.intervals.map(i => {
      return {
        ...i,
        title: t(`subscriptionFlow.${i.event.toLowerCase()}`),
        subscriptionFlowId: subscriptionFlow.id
      }
    })
    return withTitle.find(i => i.event === eventName)
  }

  /**
   * loading
   * TODO: implement load indication
   */
  const loading = useMemo(
    () => loadingSubscriptionFlow || loadingMailTemplates,
    [loadingSubscriptionFlow]
  )

  return (
    <MailTemplatesContext.Provider value={mailTemplates?.mailTemplates || []}>
      <Table>
        <TableHead>
          {subscriptionFlows.map(subscriptionFlow => (
            <TableRow key={subscriptionFlow.id}>
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
          ))}
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
                <TableCell size="small">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </MailTemplatesContext.Provider>
  )
}
