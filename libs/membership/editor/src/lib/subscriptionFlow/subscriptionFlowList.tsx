import React, {createContext, useMemo, useState} from 'react'
import {
  styled,
  Table,
  TableBody,
  TableCell,
  tableCellClasses,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import {useTranslation} from 'react-i18next'
import {useParams} from 'react-router-dom'
import {Loader} from 'rsuite'
import {useMemberPlanListQuery} from '@wepublish/editor/api'
import {ApolloClient, NormalizedCacheObject} from '@apollo/client'
import {
  FullMailTemplateFragment,
  SubscriptionEvent,
  SubscriptionInterval,
  useCreateSubscriptionFlowMutation,
  useCreateSubscriptionIntervalMutation,
  useDeleteSubscriptionFlowMutation,
  useDeleteSubscriptionIntervalMutation,
  useListPaymentMethodsQuery,
  useMailTemplateQuery,
  useSubscriptionFlowsQuery,
  useUpdateSubscriptionFlowMutation,
  useUpdateSubscriptionIntervalMutation,
  useUpdateSubscriptionIntervalsMutation
} from '@wepublish/editor/api-v2'
import {GraphqlClientContext} from './graphqlClientContext'
import {TypeAttributes} from 'rsuite/esm/@types/common'
import {DndContext, DragEndEvent} from '@dnd-kit/core'
import FilterBody from './filter/filterBody'
import FilterHead from './filter/filterHead'
import FlowHead from './timeline/timelineHead'
import ActionsHead from './events/eventsHead'
import ActionsBody from './events/eventsBody'
import TimelineBody from './timeline/timelineBody'
import DeleteSubscriptionFlow from './deleteSubscriptionFlow'
import SubscriptionFlowHeadline from './subscriptionFlowHeadline'
import {DEFAULT_MUTATION_OPTIONS, DEFAULT_QUERY_OPTIONS} from '../common'
import {
  createCheckedPermissionComponent,
  getApiClientV2,
  ListViewContainer,
  ListViewHeader,
  PermissionControl
} from '@wepublish/ui/editor'
import {MdOutlineClose, MdOutlineNoteAdd, MdTune} from 'react-icons/md'

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
  SubscriptionEvent.DeactivationByUser
] as const
type UserActionEvents = (typeof USER_ACTION_EVENTS)[number]

const NON_USER_ACTION_EVENTS = [
  SubscriptionEvent.InvoiceCreation,
  SubscriptionEvent.DeactivationUnpaid,
  SubscriptionEvent.Custom
] as const
type NonUserActionEvents = (typeof NON_USER_ACTION_EVENTS)[number]

export interface UserActionEvent {
  title: string
  description: string
  subscriptionEventKey: UserActionEvents
}

export interface UserActionInterval extends SubscriptionInterval {
  event: UserActionEvents
  daysAwayFromEnding: null
}

export interface NonUserActionInterval extends SubscriptionInterval {
  event: NonUserActionEvents
  daysAwayFromEnding: number
}

export function isNonUserEvent(event: SubscriptionEvent): event is NonUserActionEvents {
  return NON_USER_ACTION_EVENTS.includes(event as NonUserActionEvents)
}

export interface IntervalColoring {
  bg: TypeAttributes.Color
  fg: TypeAttributes.Color | string
}
export interface DecoratedSubscriptionInterval<T extends SubscriptionInterval> {
  subscriptionFlowId: string
  title: string
  object: T
  icon: JSX.Element
  color: IntervalColoring
}

/**
 * COMPONENT
 */

function SubscriptionFlowList() {
  const {t} = useTranslation()

  const params = useParams()
  const {id: memberPlanId} = params

  const defaultFlowOnly = memberPlanId === 'default'

  const [newDay, setNewDay] = useState<number | undefined>(undefined)

  /******************************************
   * API SERVICES
   ******************************************/
  const client: ApolloClient<NormalizedCacheObject> = useMemo(() => getApiClientV2(), [])

  const {data: memberPlans} = useMemberPlanListQuery({})

  const memberPlan = useMemo(() => {
    return memberPlans && memberPlans.memberPlans.nodes.find(p => p.id === memberPlanId)
  }, [memberPlanId, memberPlans])

  // get subscriptions flows
  const {
    data: subscriptionFlows,
    loading: loadingSubscriptionFlows,
    refetch
  } = useSubscriptionFlowsQuery({
    ...DEFAULT_QUERY_OPTIONS(client, t),
    variables: {
      defaultFlowOnly,
      memberPlanId
    }
  })

  const {data: mailTemplates, loading: loadingMailTemplates} = useMailTemplateQuery(
    DEFAULT_QUERY_OPTIONS(client, t)
  )
  const {data: paymentMethods} = useListPaymentMethodsQuery(DEFAULT_QUERY_OPTIONS(client, t))

  // Mutation methods are later passed to the GraphqlClientContext, so they can reuse the same client everywhere. This makes the GraphQL cache work across all requests.
  const [createSubscriptionInterval] = useCreateSubscriptionIntervalMutation(
    DEFAULT_MUTATION_OPTIONS(client, t)
  )
  const [updateSubscriptionIntervals] = useUpdateSubscriptionIntervalsMutation(
    DEFAULT_MUTATION_OPTIONS(client, t)
  )
  const [updateSubscriptionInterval] = useUpdateSubscriptionIntervalMutation(
    DEFAULT_MUTATION_OPTIONS(client, t)
  )
  const [deleteSubscriptionInterval] = useDeleteSubscriptionIntervalMutation(
    DEFAULT_MUTATION_OPTIONS(client, t)
  )
  const [createSubscriptionFlow] = useCreateSubscriptionFlowMutation({
    ...DEFAULT_MUTATION_OPTIONS(client, t),
    onCompleted: () => {
      refetch()
    }
  })
  const [updateSubscriptionFlow] = useUpdateSubscriptionFlowMutation(
    DEFAULT_MUTATION_OPTIONS(client, t)
  )
  const [deleteSubscriptionFlow] = useDeleteSubscriptionFlowMutation({
    ...DEFAULT_MUTATION_OPTIONS(client, t),
    onCompleted: () => {
      refetch()
    }
  })

  /******************************************
   * HELPER METHODS
   ******************************************/
  async function intervalDragEnd(dragEvent: DragEndEvent) {
    const interval: DecoratedSubscriptionInterval<NonUserActionInterval> = dragEvent.active.data
      .current
      ?.decoratedSubscriptionInterval as DecoratedSubscriptionInterval<NonUserActionInterval>
    const daysAwayFromEnding = dragEvent.over?.data.current?.dayIndex

    await updateSubscriptionInterval({
      variables: {
        subscriptionInterval: {
          id: interval.object.id,
          daysAwayFromEnding,
          mailTemplateId: interval.object.mailTemplate?.id
        }
      }
    })
  }

  const eventIcons: {[key: string]: JSX.Element} = {
    [SubscriptionEvent.InvoiceCreation]: <MdOutlineNoteAdd size={16} />,
    [SubscriptionEvent.DeactivationUnpaid]: <MdOutlineClose size={16} />
  }

  const eventColors: {[key: string]: IntervalColoring} = {
    [SubscriptionEvent.InvoiceCreation]: {bg: 'green', fg: 'white'},
    [SubscriptionEvent.DeactivationUnpaid]: {bg: 'orange', fg: 'white'}
  }

  const loading: boolean = useMemo(
    () => loadingSubscriptionFlows || loadingMailTemplates,
    [loadingSubscriptionFlows, loadingMailTemplates]
  )

  const userActionEvents: UserActionEvent[] = useMemo(() => {
    return USER_ACTION_EVENTS.map(eventName => {
      return {
        title: t(`subscriptionFlow.${eventName.toLowerCase()}`),
        description: t(`subscriptionFlow.${eventName.toLowerCase()}Description`),
        subscriptionEventKey: eventName
      }
    })
  }, [USER_ACTION_EVENTS])

  const intervals: SubscriptionInterval[] = useMemo(() => {
    if (!subscriptionFlows) {
      return []
    }
    let intervals: SubscriptionInterval[] = []
    for (const flow of subscriptionFlows.subscriptionFlows) {
      intervals = intervals.concat(flow.intervals)
    }
    return intervals
  }, [subscriptionFlows])

  const days = useMemo(() => {
    // Take existing intervals, maybe insert new day, drop all empty days, always show zero day and sort ascending
    const days = intervals
      .map(i => i.daysAwayFromEnding)
      .concat([newDay])
      .concat([0])
      .filter(i => i !== undefined && i !== null)
      .sort((a, b) => a! - b!)
    return days.filter((value, index, array) => array.indexOf(value) === index)
  }, [intervals, newDay])

  // Add a separation border after every table section (filters | user actions | timeline | actions)
  const filterCount = defaultFlowOnly ? 0 : 4
  const userActionCount = userActionEvents.length
  const nonUserActionCount = days.length

  /******************************************
   * CUSTOM ELEMENTS
   ******************************************/

  const SplitTableRow = styled(TableRow)(({theme}) => ({
    [`.${tableCellClasses.head}`]: {
      backgroundColor: theme.palette.action.hover
    },
    [`.${tableCellClasses.head}:nth-of-type(${filterCount}), .${
      tableCellClasses.head
    }:nth-of-type(${filterCount + userActionCount}), .${tableCellClasses.head}:nth-of-type(${
      filterCount + userActionCount + nonUserActionCount
    })`]: {
      borderRight: `1px solid ${theme.palette.common.black}`
    },
    [`.${tableCellClasses.body}:nth-of-type(${filterCount}), .${
      tableCellClasses.body
    }:nth-of-type(${filterCount + userActionCount}), .${tableCellClasses.body}:nth-of-type(${
      filterCount + userActionCount + nonUserActionCount
    })`]: {
      borderRight: `1px solid ${theme.palette.common.black}`
    }
  }))

  if (loading || !subscriptionFlows) {
    return <Loader center />
  }

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>
            <MdTune style={{marginRight: '4px'}} />
            {defaultFlowOnly
              ? t('subscriptionFlow.titleDefaultSettings')
              : `«${memberPlan?.name || ''}»`}
          </h2>
          {!defaultFlowOnly && (
            <Typography variant="subtitle1">{t('subscriptionFlow.settingsDescription')}</Typography>
          )}
        </ListViewHeader>
      </ListViewContainer>
      <TableContainer style={{marginTop: '16px', maxWidth: '100%'}}>
        <MailTemplatesContext.Provider value={mailTemplates?.mailTemplates || []}>
          <GraphqlClientContext.Provider
            value={{
              createSubscriptionInterval,
              updateSubscriptionInterval,
              updateSubscriptionIntervals,
              deleteSubscriptionInterval,
              createSubscriptionFlow,
              updateSubscriptionFlow,
              deleteSubscriptionFlow
            }}>
            <Table size="small">
              <TableHead>
                {/************************************************** TABLE HEADLINE **************************************************/}
                <TableRow>
                  <SubscriptionFlowHeadline
                    defaultFlowOnly={defaultFlowOnly}
                    userActionCount={userActionCount}
                    filterCount={filterCount}
                    nonUserActionCount={nonUserActionCount}
                  />
                </TableRow>
                {/************************************************** TABLE HEAD **************************************************/}
                <SplitTableRow>
                  {/************************************************** FILTERS **************************************************/}
                  <FilterHead defaultFlowOnly={defaultFlowOnly} />

                  {/************************************************** EVENTS **************************************************/}
                  {userActionEvents.map(userActionEvent => (
                    <TableCell key={userActionEvent.subscriptionEventKey} align="center">
                      {userActionEvent.title}
                    </TableCell>
                  ))}

                  {/************************************************** TIMELINE **************************************************/}
                  <FlowHead days={days} intervals={intervals} />

                  {/************************************************** ACTIONS **************************************************/}
                  <ActionsHead setNewDay={setNewDay} />
                </SplitTableRow>
              </TableHead>

              {/************************************************** TABLE BODY **************************************************/}
              <TableBody>
                {subscriptionFlows.subscriptionFlows.map(subscriptionFlow => (
                  <SplitTableRow key={subscriptionFlow.id}>
                    <DndContext onDragEnd={event => intervalDragEnd(event)}>
                      {/************************************************** FILTERS **************************************************/}
                      <FilterBody
                        memberPlan={memberPlan}
                        subscriptionFlow={subscriptionFlow}
                        defaultFlowOnly={defaultFlowOnly}
                        paymentMethods={paymentMethods}
                      />
                      {/************************************************** EVENTS **************************************************/}
                      <ActionsBody
                        subscriptionFlow={subscriptionFlow}
                        userActionEvents={userActionEvents}
                        eventIcons={eventIcons}
                        eventColors={eventColors}
                      />

                      {/************************************************** TIMELINE **************************************************/}
                      <TimelineBody
                        subscriptionFlow={subscriptionFlow}
                        days={days}
                        eventIcons={eventIcons}
                        eventColors={eventColors}
                      />

                      {/************************************************** ACTIONS **************************************************/}
                      <TableCell align="center">
                        <DeleteSubscriptionFlow subscriptionFlow={subscriptionFlow} />
                      </TableCell>
                    </DndContext>
                  </SplitTableRow>
                ))}
              </TableBody>

              {/************************************************** CREATE NEW FLOW **************************************************/}
              {!defaultFlowOnly && (
                <PermissionControl
                  showRejectionMessage={false}
                  qualifyingPermissions={['CAN_CREATE_SUBSCRIPTION_FLOW']}>
                  <TableBody>
                    <SplitTableRow>
                      <FilterBody
                        memberPlan={memberPlan}
                        createNewFlow
                        paymentMethods={paymentMethods}
                      />
                    </SplitTableRow>
                  </TableBody>
                </PermissionControl>
              )}
            </Table>
          </GraphqlClientContext.Provider>
        </MailTemplatesContext.Provider>
      </TableContainer>
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_SUBSCRIPTION_FLOWS',
  'CAN_UPDATE_SUBSCRIPTION_FLOW',
  'CAN_CREATE_SUBSCRIPTION_FLOW',
  'CAN_DELETE_SUBSCRIPTION_FLOW'
])(SubscriptionFlowList)
export {CheckedPermissionComponent as SubscriptionFlowList}
