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
  const subscriptionNonUserActions: SubscriptionIntervalWithTitle[] = useMemo(() => {
    if (!subscriptionFlow) {
      return []
    }

    const allIntervals: (UserActionInterval | NonUserActionInterval)[] = subscriptionFlow.intervals

    const intervals: SubscriptionIntervalWithTitle[] = allIntervals
      .filter(isNonUserAction)
      .map(i => {
        return {...i, title: t(`subscriptionFlow.${i.event.toLowerCase()}`)}
      })

    return intervals.sort((a, b) => {
      if (!a.daysAwayFromEnding || !b.daysAwayFromEnding) {
        return -1
      }
      return a.daysAwayFromEnding - b.daysAwayFromEnding
    })
  }, [t, subscriptionFlow])

  const timeLineArray: number[] = useMemo(() => {
    const maxDaysInTimeline = Math.max(
      ...subscriptionNonUserActions.map(action => action.daysAwayFromEnding!)
    )
    return [...Array(maxDaysInTimeline + 2)]
  }, [subscriptionNonUserActions])

  /**
   * FUNCTIONS
   */
  function getSubscriptionActionsByDay(dayIndex: number) {
    return subscriptionNonUserActions.filter(userAction => {
      if (!userAction.daysAwayFromEnding && dayIndex === 0) {
        return true
      }
      if (userAction.daysAwayFromEnding === dayIndex) {
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
        {timeLineArray.map((day, dayIndex) => {
          const currentIntervals = dayIndex % 2 === 0 ? getSubscriptionActionsByDay(dayIndex) : []
          return (
            <TimeLineDay>
              {dayIndex % 2 === 0 && (
                <UpperIntervalContainer>
                  <DropContainerSubscriptionInterval dayIndex={dayIndex} />
                </UpperIntervalContainer>
              )}

              <UpperIntervalContainer>
                {currentIntervals.map(currentInterval => (
                  <SubscriptionInterval subscriptionInterval={currentInterval} />
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
          const currentIntervals = dayIndex % 2 !== 0 ? getSubscriptionActionsByDay(dayIndex) : []
          return (
            <TimeLineDay>
              <LowerIntervalContainer>
                {currentIntervals.map(currentInterval => (
                  <SubscriptionInterval subscriptionInterval={currentInterval} />
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
