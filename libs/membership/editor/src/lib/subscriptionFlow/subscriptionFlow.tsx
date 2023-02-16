import React, {useContext, useMemo} from 'react'
import {
  SubscriptionFlowFragment,
  SubscriptionIntervalFragment,
  useUpdateSubscriptionIntervalMutation
} from '@wepublish/editor/api-v2'
import {
  isNonUserAction,
  NonUserActionInterval,
  SubscriptionIntervalWithTitle,
  UserActionInterval
} from './subscriptionFlows'
import {useTranslation} from 'react-i18next'
import SubscriptionInterval from './subscriptionInterval'
import {Tag} from 'rsuite'
import styled from '@emotion/styled'
import {DndContext, DragEndEvent} from '@dnd-kit/core'
import DropContainerSubscriptionInterval from './dropContainerSubscriptionInterval'
import {GraphqlClientContext} from './graphqlClientContext'

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
}

export default function SubscriptionFlow({subscriptionFlow}: SubscriptionTimelineProps) {
  const {t} = useTranslation()

  const client = useContext(GraphqlClientContext)

  const [updateSubscriptionInterval, {loading: intervalUpdateLoading}] =
    useUpdateSubscriptionIntervalMutation({
      client
      // TODO: onError: showErrors
    })

  // sorted subscription intervals
  const subscriptionNonUserIntervals: SubscriptionIntervalWithTitle[] = useMemo(() => {
    if (!subscriptionFlow) {
      return []
    }

    const allIntervals: (UserActionInterval | NonUserActionInterval)[] = subscriptionFlow.intervals

    const intervals: SubscriptionIntervalWithTitle[] = allIntervals
      .filter(isNonUserAction)
      .map(i => {
        return {
          ...i,
          title: t(`subscriptionFlow.${i.event.toLowerCase()}`),
          subscriptionFlowId: subscriptionFlow.id
        }
      })

    return intervals.sort((a, b) => {
      if (!a.daysAwayFromEnding || !b.daysAwayFromEnding) {
        return -1
      }
      return a.daysAwayFromEnding - b.daysAwayFromEnding
    })
  }, [t, subscriptionFlow])

  const timeLineArray: number[] = useMemo(() => {
    const minDaysInTimeline = Math.min(
      ...subscriptionNonUserIntervals.map(action => action.daysAwayFromEnding!)
    )
    const maxDaysInTimeline = Math.max(
      ...subscriptionNonUserIntervals.map(action => action.daysAwayFromEnding!)
    )
    const timelineStart = Math.min(0, minDaysInTimeline - 2)
    const timelineEnd = maxDaysInTimeline + 2
    // create array of numbers from start to end
    return Array.from({length: timelineEnd - timelineStart}, (_, i) => timelineStart + 1 + i)
  }, [subscriptionNonUserIntervals])

  /**
   * FUNCTIONS
   */
  function getSubscriptionActionsByDay(dayIndex: number) {
    return subscriptionNonUserIntervals.filter(interval => {
      if (!interval.daysAwayFromEnding && dayIndex === 0) {
        return true
      }
      if (interval.daysAwayFromEnding === dayIndex) {
        return true
      }
      return false
    })
  }

  async function intervalDragEnd(dragEvent: DragEndEvent) {
    const interval: SubscriptionIntervalFragment = dragEvent.active.data.current
      ?.subscriptionInterval as SubscriptionIntervalFragment
    const daysAwayFromEnding = dragEvent.over?.data.current?.dayIndex

    await updateSubscriptionInterval({
      variables: {
        subscriptionInterval: {
          id: interval.id,
          daysAwayFromEnding,
          mailTemplateId: interval.mailTemplate.id
        }
      }
    })
  }

  return (
    <DndContext onDragEnd={event => intervalDragEnd(event)}>
      {/* upper subscription intervals */}
      <TimeLineContainer style={{alignItems: 'flex-end'}}>
        {timeLineArray.map(day => {
          const currentIntervals = day % 2 === 0 ? getSubscriptionActionsByDay(day) : []
          return (
            <TimeLineDay>
              {day % 2 === 0 && (
                <UpperIntervalContainer>
                  <DropContainerSubscriptionInterval dayIndex={day}>
                    {currentIntervals.map(currentInterval => (
                      <SubscriptionInterval
                        subscriptionInterval={currentInterval}
                        subscriptionFlow={subscriptionFlow}
                        event={currentInterval.event}
                      />
                    ))}
                  </DropContainerSubscriptionInterval>
                </UpperIntervalContainer>
              )}
            </TimeLineDay>
          )
        })}
      </TimeLineContainer>

      {/* timeline */}
      <TimeLineContainer>
        {timeLineArray.map(day => (
          <TimeLineDay>
            <div
              style={{
                height: '15px',
                marginBottom: '15px',
                borderRight: day % 2 === 0 ? '1px solid black' : 'none'
              }}
            />

            <div
              style={{
                borderBottom: day !== 0 ? '1px solid black' : 'none',
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
                    Tag {day}
                  </Tag>
                </div>
              </div>
            </div>

            <div
              style={{
                height: '15px',
                marginTop: '15px',
                borderRight: day % 2 !== 0 ? '1px solid black' : 'none'
              }}
            />
          </TimeLineDay>
        ))}
      </TimeLineContainer>

      {/* upper subscription intervals */}
      <TimeLineContainer>
        {timeLineArray.map(day => {
          const currentIntervals = day % 2 !== 0 ? getSubscriptionActionsByDay(day) : []
          return (
            <TimeLineDay>
              {day % 2 !== 0 && (
                <LowerIntervalContainer>
                  <DropContainerSubscriptionInterval dayIndex={day}>
                    {currentIntervals.map(currentInterval => (
                      <SubscriptionInterval
                        subscriptionInterval={currentInterval}
                        subscriptionFlow={subscriptionFlow}
                        event={currentInterval.event}
                      />
                    ))}
                  </DropContainerSubscriptionInterval>
                </LowerIntervalContainer>
              )}
            </TimeLineDay>
          )
        })}
      </TimeLineContainer>
    </DndContext>
  )
}
