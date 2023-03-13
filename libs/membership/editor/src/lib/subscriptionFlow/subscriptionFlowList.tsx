import React, {createContext, useMemo, useRef, useState} from 'react'
import {ListViewContainer, ListViewHeader} from '../../../../../../apps/editor/src/app/ui/listView'
import {
  css,
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
import {
  MdAdd,
  MdAlarmOn,
  MdDelete,
  MdFilterAlt,
  MdMouse,
  MdOutlineClose,
  MdOutlineNoteAdd,
  MdTune
} from 'react-icons/all'
import {TFunction, useTranslation} from 'react-i18next'
import {useParams} from 'react-router-dom'
import {Button, IconButton, InputNumber, Loader, Message, Popover, toaster, Whisper} from 'rsuite'
import {useMemberPlanListQuery} from '@wepublish/editor/api'
import {ApolloClient, ApolloError, NormalizedCacheObject} from '@apollo/client'
import {getApiClientV2} from 'apps/editor/src/app/utility'
import {
  FullMailTemplateFragment,
  SubscriptionEvent,
  SubscriptionFlowFragment,
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
import MailTemplateSelect from './mailTemplateSelect'
import {TypeAttributes} from 'rsuite/esm/@types/common'
import DraggableSubscriptionInterval from './draggableSubscriptionInterval'
import {DndContext, DragEndEvent} from '@dnd-kit/core'
import DroppableSubscriptionInterval from './droppableSubscriptionInterval'
import FilterBody from './filter/filterBody'
import FilterHead from './filter/filterHead'
import FlowHead from './flow/flowHead'

/**
 * CONTEXT
 */
const MailTemplatesContext = createContext<FullMailTemplateFragment[]>([])

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

interface CreateDayFormType {
  open: boolean
  dayNumber: string | number
}

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

export function isNonUserEvent(event: SubscriptionEvent): event is NonUserActionEvents {
  return NON_USER_ACTION_EVENTS.includes(event as NonUserActionEvents)
}

interface IntervalColoring {
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

export default function () {
  const {t} = useTranslation()

  const params = useParams()
  const {id: memberPlanId} = params

  const defaultFlowOnly = memberPlanId === 'default'

  const [newDay, setNewDay] = useState<number | undefined>(undefined)
  const createDayFrom = useRef<CreateDayFormType>({
    open: false,
    dayNumber: -3
  })

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

  const userActionIntervalFor = function (
    subscriptionFlow: SubscriptionFlowFragment,
    eventName: string
  ): DecoratedSubscriptionInterval<NonUserActionInterval> | undefined {
    const withTitle = subscriptionFlow.intervals.map(i => {
      return {
        title: t(`subscriptionFlow.${i.event.toLowerCase()}`),
        subscriptionFlowId: subscriptionFlow.id,
        object: i,
        icon: eventIcons[i.event.toUpperCase()],
        color: eventColors[i.event.toUpperCase()]
      }
    })
    return withTitle.find(
      i => i.object.event === eventName
    ) as DecoratedSubscriptionInterval<NonUserActionInterval>
  }

  const nonUserActionIntervalsFor = function (
    subscriptionFlow: SubscriptionFlowFragment,
    days: number
  ): DecoratedSubscriptionInterval<NonUserActionInterval>[] {
    const intervals = subscriptionFlow.intervals.filter(i => i.daysAwayFromEnding === days)
    return intervals.map(i => {
      return {
        title: t(`subscriptionFlow.${i.event.toLowerCase()}`),
        subscriptionFlowId: subscriptionFlow.id,
        object: i,
        icon: eventIcons[i.event.toUpperCase()],
        color: eventColors[i.event.toUpperCase()]
      }
    }) as DecoratedSubscriptionInterval<NonUserActionInterval>[]
  }

  const loading: boolean = useMemo(
    () => loadingSubscriptionFlows || loadingMailTemplates,
    [loadingSubscriptionFlows, loadingMailTemplates]
  )

  const userActionEvents = USER_ACTION_EVENTS.map(eventName => {
    return {
      title: t(`subscriptionFlow.${eventName.toLowerCase()}`),
      description: t(`subscriptionFlow.${eventName.toLowerCase()}Description`),
      subscriptionEventKey: eventName
    }
  })

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

  // Add a new day to timeline
  const addDayToTimeline = function () {
    if (createDayFrom.current.dayNumber !== null) {
      setNewDay(Number(createDayFrom.current.dayNumber))
    }
  }

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
  const TableCellBottom = styled(TableCell)`
    vertical-align: bottom;
  `
  const PopoverBody = styled('div')<{wrap?: boolean}>`
    display: flex;
    min-width: 170px;
    justify-content: center;
    ${props =>
      props.wrap &&
      css`
        flex-wrap: wrap;
      `}
  `
  const FlexContainer = styled('div')`
    display: flex;
  `

  const DarkTableCell = styled(TableCell)(({theme}) => ({
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
    borderRight: `1px solid ${theme.palette.common.white}`
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
      <TableContainer style={{marginTop: '16px'}}>
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
                <TableRow>
                  {!defaultFlowOnly && (
                    <DarkTableCell align="center" colSpan={filterCount}>
                      <MdFilterAlt size={20} style={{marginRight: '5px'}} />
                      Filters
                    </DarkTableCell>
                  )}
                  <DarkTableCell align="center" colSpan={userActionCount}>
                    <MdMouse size={20} style={{marginRight: '5px'}} />
                    User Actions
                  </DarkTableCell>
                  <DarkTableCell align="center" colSpan={nonUserActionCount}>
                    <MdAlarmOn size={20} style={{marginRight: '5px'}} />
                    Timeline
                  </DarkTableCell>
                  <DarkTableCell align="center">Actions</DarkTableCell>
                </TableRow>
                <SplitTableRow>
                  {/* filter */}
                  <FilterHead defaultFlowOnly={defaultFlowOnly} />

                  {/* user actions */}
                  {userActionEvents.map(userActionEvent => (
                    <TableCell key={userActionEvent.subscriptionEventKey} align="center">
                      {userActionEvent.title}
                    </TableCell>
                  ))}

                  {/* individual flow */}
                  <FlowHead days={days} intervals={intervals} />

                  {/* actions */}
                  <TableCell align="center">
                    <Whisper
                      placement="leftEnd"
                      trigger="click"
                      speaker={
                        <Popover>
                          <PopoverBody wrap>
                            <h6>New day in timeline</h6>
                            <FlexContainer style={{marginTop: '5px'}}>
                              <InputNumber
                                defaultValue={createDayFrom.current.dayNumber}
                                onChange={v => (createDayFrom.current.dayNumber = v)}
                                step={1}
                              />
                              <Button
                                onClick={() => addDayToTimeline()}
                                appearance="primary"
                                style={{marginLeft: '5px'}}>
                                Add
                              </Button>
                            </FlexContainer>
                          </PopoverBody>
                        </Popover>
                      }>
                      <IconButton icon={<MdAdd />} color="green" appearance="primary" circle />
                    </Whisper>
                  </TableCell>
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
                      {/************************************************** USER ACTIONS **************************************************/}
                      {userActionEvents.map(event => (
                        <TableCell key={event.subscriptionEventKey} align="center">
                          {mailTemplates && mailTemplates.mailTemplates && (
                            <MailTemplateSelect
                              mailTemplates={mailTemplates.mailTemplates}
                              subscriptionInterval={userActionIntervalFor(
                                subscriptionFlow,
                                event.subscriptionEventKey
                              )}
                              subscriptionFlow={subscriptionFlow}
                              event={event.subscriptionEventKey}
                            />
                          )}
                        </TableCell>
                      ))}

                      {/************************************************** TIMELINE **************************************************/}
                      {days &&
                        mailTemplates &&
                        days.map(day => {
                          const currentIntervals = nonUserActionIntervalsFor(subscriptionFlow, day!)
                          // no interval
                          if (currentIntervals.length === 0) {
                            return (
                              <TableCellBottom
                                key={`day-${day}`}
                                align="center"
                                style={day === 0 ? {backgroundColor: 'lightyellow'} : {}}>
                                <DraggableSubscriptionInterval
                                  mailTemplates={mailTemplates.mailTemplates}
                                  subscriptionInterval={undefined}
                                  subscriptionFlow={subscriptionFlow}
                                  event={SubscriptionEvent.Custom}
                                  newDaysAwayFromEnding={day as number}
                                />
                                <DroppableSubscriptionInterval dayIndex={day || 0} />
                              </TableCellBottom>
                            )
                          }
                          // some intervals
                          return (
                            <TableCellBottom
                              key={`day-${day}`}
                              align="center"
                              style={day === 0 ? {backgroundColor: 'lightyellow'} : {}}>
                              {currentIntervals.map(currentInterval => (
                                <DraggableSubscriptionInterval
                                  subscriptionInterval={currentInterval}
                                  subscriptionFlow={subscriptionFlow}
                                  mailTemplates={mailTemplates.mailTemplates}
                                />
                              ))}

                              <DroppableSubscriptionInterval dayIndex={day || 0} />
                            </TableCellBottom>
                          )
                        })}

                      {/************************************************** ACTIONS **************************************************/}
                      <TableCell align="center">
                        <Whisper
                          placement="leftEnd"
                          trigger="click"
                          speaker={
                            <Popover>
                              <p>
                                Wenn Du diesen Flow löscht, kann dies nicht rückgängig gemacht
                                werden. Willst Du trotzdem weiterfahren?
                              </p>
                              <IconButton
                                style={{marginTop: '5px'}}
                                color="red"
                                size="sm"
                                appearance="primary"
                                icon={<MdDelete />}
                                onClick={async () => {
                                  await deleteSubscriptionFlow({
                                    variables: {subscriptionFlowId: subscriptionFlow.id}
                                  })
                                  await refetch()
                                }}>
                                Unwiderruflich Löschen
                              </IconButton>
                            </Popover>
                          }>
                          <IconButton
                            size="sm"
                            color="red"
                            circle
                            appearance="primary"
                            icon={<MdDelete />}
                            disabled={subscriptionFlow.default}
                          />
                        </Whisper>
                      </TableCell>
                    </DndContext>
                  </SplitTableRow>
                ))}
              </TableBody>

              {/************************************************** CREATE NEW FLOW **************************************************/}
              {!defaultFlowOnly && (
                <TableBody>
                  <SplitTableRow>
                    <FilterBody
                      memberPlan={memberPlan}
                      createNewFlow
                      onNewFlowCreated={() => refetch()}
                    />
                  </SplitTableRow>
                </TableBody>
              )}
            </Table>
          </GraphqlClientContext.Provider>
        </MailTemplatesContext.Provider>
      </TableContainer>
    </>
  )
}
