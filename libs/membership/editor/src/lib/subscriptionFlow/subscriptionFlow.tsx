import React, {useMemo} from 'react'
import {SubscriptionFlowFragment, useUpdateSubscriptionIntervalMutation} from '@wepublish/editor/api-v2'
import {SubscriptionNonUserAction} from './subscriptionFlows'
import {useTranslation} from 'react-i18next'
import SubscriptionInterval from './subscriptionInterval'
import {Tag} from 'rsuite'
import styled from '@emotion/styled'
import {DndContext, DragEndEvent} from '@dnd-kit/core'
import DropContainerSubscriptionInterval from './dropContainerSubscriptionInterval'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'

const TimeLineContainer = styled.div`
  display: flex;
  flex-wrap: nowrap;
`

const TimeLineDay = styled.div`
  width: 80px;
`
const UpperIntervalContainer = styled.div`
  margin-left: 10px;
  width: 140px;
  background: white;
  text-align: center;
  padding-bottom: 10px;
`

const LowerIntervalContainer = styled.div`
  margin-left: 10px;
  width: 140px;
  background: white;
  text-align: center;
`

interface SubscriptionTimelineProps {
  subscriptionFlow: SubscriptionFlowFragment
  client: ApolloClient<NormalizedCacheObject>
}

export default function SubscriptionFlow({subscriptionFlow, client}: SubscriptionTimelineProps) {
  const {t} = useTranslation()

  const [updateSubscriptionInterval, {loading: intervalUpdateLoading}] = useUpdateSubscriptionIntervalMutation({
    client,
    // TODO: onError: showErrors
  })

  // sorted subscription intervals
  const subscriptionNonUserActions: SubscriptionNonUserAction[] = useMemo(() => {
    if (!subscriptionFlow) {
      return []
    }

    const intervals: SubscriptionNonUserAction[] = subscriptionFlow.additionalIntervals.map(subscriptionInterval => {
      return {
        title: t('subscriptionFlow.additionalIntervalTitle'),
        description: t('subscriptionFlow.additionalIntervalDescription'),
        subscriptionInterval
      }
    })

    if(subscriptionFlow.invoiceCreationMailTemplate) {
      intervals.push({
        subscriptionEventKey: 'invoiceCreationMailTemplate',
        subscriptionInterval: subscriptionFlow['invoiceCreationMailTemplate'],
        title: t('subscriptionFlow.invoiceCreationTitle'),
        description: t('subscriptionFlow.invoiceCreationDescription')
      })
    }

    if(subscriptionFlow.deactivationUnpaidMailTemplate) {
      intervals.push({
        subscriptionEventKey: 'deactivationUnpaidMailTemplate',
        subscriptionInterval: subscriptionFlow['deactivationUnpaidMailTemplate'],
        title: t('subscriptionFlow.deactivationUnpaidTitle'),
        description: t('subscriptionFlow.deactivationUnpaidDescription')
      })
    }

    return intervals.sort((a, b) => {
      if (!a.subscriptionInterval || !b.subscriptionInterval) {
        return -1
      }
      return a.subscriptionInterval.daysAwayFromEnding - b.subscriptionInterval.daysAwayFromEnding
    })
  }, [subscriptionFlow])

  const timeLineArray: number[] = useMemo(() => {
    const maxDaysInTimeline = Math.max(
      ...subscriptionNonUserActions.map(
        action => action.subscriptionInterval.daysAwayFromEnding
      )
    )
    return [...Array(maxDaysInTimeline + 2)]
  }, [subscriptionNonUserActions])

  /**
   * FUNCTIONS
   */
  function getSubscriptionActionsByDay(dayIndex: number) {
    return subscriptionNonUserActions.filter(userAction => {
      const subscriptionInterval = userAction.subscriptionInterval
      if (!subscriptionInterval.daysAwayFromEnding && dayIndex === 0) {
        return true
      }
      if (subscriptionInterval.daysAwayFromEnding === dayIndex) {
        return true
      }
      return false
    })
  }

  async function intervalDragEnd(dragEvent: DragEndEvent) {
    const id = dragEvent.active.data.current?.subscriptionInterval.id
    const daysAwayFromEnding = dragEvent.over?.data.current?.dayIndex

    await updateSubscriptionInterval({
      variables: {
        subscriptionInterval: {
          id,
          daysAwayFromEnding
        }
      }
    })
  }

  return (
    <DndContext onDragEnd={event => intervalDragEnd(event)}>
        {/* upper subscription intervals */}
        <TimeLineContainer style={{alignItems: 'flex-end'}}>
          {timeLineArray.map((day, dayIndex) => {
            const currentNonUserActions =
              dayIndex % 2 === 0 ? getSubscriptionActionsByDay(dayIndex) : []
            return (
              <TimeLineDay>
                {dayIndex % 2 === 0 && (
                  <UpperIntervalContainer>
                    <DropContainerSubscriptionInterval dayIndex={dayIndex} />
                  </UpperIntervalContainer>
                )}

                <UpperIntervalContainer>
                  {!!currentNonUserActions.length &&
                    currentNonUserActions.map(currentNonUserAction => (
                      <SubscriptionInterval subscriptionNonUserAction={currentNonUserAction} client={client} />
                    ))}
                </UpperIntervalContainer>
              </TimeLineDay>
            )
          })}
        </TimeLineContainer>

        {/* timeline */}
        <TimeLineContainer>
          {timeLineArray.map((day, dayIndex) => (
            <TimeLineDay>
              <div
                style={{
                  height: '15px',
                  marginBottom: '15px',
                  borderRight: dayIndex % 2 === 0 ? '1px solid black' : 'none'
                }}
              />

              <div
                style={{
                  borderBottom: dayIndex !== 0 ? '1px solid black' : 'none',
                  position: 'relative'
                }}>
                {/* day number */}
                <div
                  style={{
                    position: 'absolute',
                    right: '-40px',
                    zIndex: 1,
                    bottom: '-10px',
                    width: '100%'
                  }}>
                  <div style={{textAlign: 'center'}}>
                    <Tag color="green" size="sm">
                      Tag {dayIndex}
                    </Tag>
                  </div>
                </div>
              </div>

              <div
                style={{
                  height: '15px',
                  marginTop: '15px',
                  borderRight: dayIndex % 2 !== 0 ? '1px solid black' : 'none'
                }}
              />
            </TimeLineDay>
          ))}
        </TimeLineContainer>

        {/* upper subscription intervals */}
        <TimeLineContainer>
          {timeLineArray.map((day, dayIndex) => {
            const currentNonUserActions =
              dayIndex % 2 !== 0 ? getSubscriptionActionsByDay(dayIndex) : []
            return (
              <TimeLineDay>
                <LowerIntervalContainer>
                  {!!currentNonUserActions.length &&
                    currentNonUserActions.map(currentNonUserAction => (
                      <SubscriptionInterval subscriptionNonUserAction={currentNonUserAction} client={client} />
                    ))}
                </LowerIntervalContainer>

                {dayIndex % 2 !== 0 && (
                  <LowerIntervalContainer>
                    <DropContainerSubscriptionInterval dayIndex={dayIndex} />
                  </LowerIntervalContainer>
                )}
              </TimeLineDay>
            )
          })}
        </TimeLineContainer>
      </DndContext>
  )
}
