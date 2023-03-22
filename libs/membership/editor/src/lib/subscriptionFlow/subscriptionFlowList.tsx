import React, {createContext, useMemo, useState} from 'react'
import {ListViewContainer, ListViewHeader} from '../../../../../../apps/editor/src/app/ui/listView'
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
import {MdOutlineClose, MdOutlineNoteAdd, MdTune} from 'react-icons/all'
import {TFunction, useTranslation} from 'react-i18next'
import {useParams} from 'react-router-dom'
import {Loader, Message, toaster} from 'rsuite'
import {useMemberPlanListQuery} from '@wepublish/editor/api'
import {ApolloClient, ApolloError, NormalizedCacheObject} from '@apollo/client'
import {getApiClientV2} from 'apps/editor/src/app/utility'
import {
  FullMailTemplateFragment,
  SubscriptionEvent,
  SubscriptionInterval,
  useCreateSubscriptionIntervalMutation,
  useDeleteSubscriptionFlowMutation,
  useDeleteSubscriptionIntervalMutation,
  useMailTemplateQuery,
  useSubscriptionFlowsQuery,
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
import {
  createCheckedPermissionComponent,
  PermissionControl
} from '../../../../../../apps/editor/src/app/atoms/permissionControl'

/**
 * CONTEXT
 */
export const MailTemplatesContext = createContext<FullMailTemplateFragment[]>([])

export const showErrors = (error: ApolloError): void => {
  toaster.push(
    <Message type="error" showIcon closable duration={8000}>
      {error.message}
    </Message>
  )
}

export const showSavedToast = (t: TFunction): void => {
  toaster.push(
    <Message type="success" showIcon closable duration={3000}>
      {t('subscriptionFlow.savedChange')}
    </Message>
  )
}

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
  subscriptionFlowId: number
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
    variables: {
      defaultFlowOnly,
      memberPlanId
    },
    client,
    onError: showErrors
  })

  // get mail templates
  const {data: mailTemplates, loading: loadingMailTemplates} = useMailTemplateQuery({
    client,
    onError: showErrors
  })

  const [createSubscriptionInterval] = useCreateSubscriptionIntervalMutation({
    client,
    onError: showErrors,
    onCompleted: () => showSavedToast(t)
  })
  const [updateSubscriptionIntervals] = useUpdateSubscriptionIntervalsMutation({
    client,
    onError: showErrors,
    onCompleted: () => showSavedToast(t)
  })
  const [updateSubscriptionInterval] = useUpdateSubscriptionIntervalMutation({
    client,
    onError: showErrors,
    onCompleted: () => showSavedToast(t)
  })
  const [deleteSubscriptionInterval] = useDeleteSubscriptionIntervalMutation({
    client,
    onError: showErrors,
    onCompleted: () => showSavedToast(t)
  })
  const [deleteSubscriptionFlow] = useDeleteSubscriptionFlowMutation({
    client,
    onError: showErrors,
    onCompleted: () => showSavedToast(t)
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
            <MdTune />
            {defaultFlowOnly
              ? t('subscriptionFlow.titleDefaultSettings')
              : `${memberPlan?.name || ''} ${t('subscriptionFlow.titleSettings')}`}
          </h2>
          <Typography variant="subtitle1">{t('subscriptionFlow.settingsDescription')}</Typography>
        </ListViewHeader>
      </ListViewContainer>
      <TableContainer style={{marginTop: '16px', overflow: 'hidden', overflowAnchor: 'none'}}>
        <MailTemplatesContext.Provider value={mailTemplates?.mailTemplates || []}>
          <GraphqlClientContext.Provider
            value={{
              createSubscriptionInterval,
              updateSubscriptionInterval,
              updateSubscriptionIntervals,
              deleteSubscriptionInterval,
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
                        <DeleteSubscriptionFlow
                          subscriptionFlow={subscriptionFlow}
                          onSubscriptionFlowDeleted={refetch}
                        />
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
                        onNewFlowCreated={() => refetch()}
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
