import React, {useMemo} from 'react'
import {SubscriptionFlowFragment} from '@wepublish/editor/api-v2'
import {SubscriptionNonUserAction} from './subscriptionFlows'
import {useTranslation} from 'react-i18next'
import SubscriptionInterval from './subscriptionInterval'
import {Tag} from 'rsuite'
import styled from '@emotion/styled'
import {DndContext, DragEndEvent} from '@dnd-kit/core'
import DropContainerSubscriptionInterval from './dropContainerSubscriptionInterval'

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

  // sorted subscription intervals
  const subscriptionNonUserActions: SubscriptionNonUserAction[] = useMemo(() => {
    if (!subscriptionFlow) {
      return []
    }
    return (
      [
        ...subscriptionFlow.additionalIntervals.map(subscriptionInterval => {
          return {
            title: t('subscriptionFlow.additionalIntervalTitle'),
            description: t('subscriptionFlow.additionalIntervalDescription'),
            subscriptionInterval
          }
        }),
        {
          subscriptionEventKey: 'invoiceCreationMailTemplate',
          subscriptionInterval: subscriptionFlow['invoiceCreationMailTemplate'],
          title: t('subscriptionFlow.invoiceCreationTitle'),
          description: t('subscriptionFlow.invoiceCreationDescription')
        },
        {
          subscriptionEventKey: 'deactivationUnpaidMailTemplate',
          subscriptionInterval: subscriptionFlow['deactivationUnpaidMailTemplate'],
          title: t('subscriptionFlow.deactivationUnpaidTitle'),
          description: t('subscriptionFlow.deactivationUnpaidDescription')
        }
      ] as SubscriptionNonUserAction[]
    ).sort((a, b) => {
      if (!a.subscriptionInterval || !b.subscriptionInterval) {
        return -1
      }
      return a.subscriptionInterval.daysAwayFromEnding - b.subscriptionInterval.daysAwayFromEnding
    })
  }, [subscriptionFlow])

  const timeLineArray: number[] = useMemo(() => {
    const maxDaysInTimeline = Math.max(
      ...subscriptionNonUserActions.map(
        action => action.subscriptionInterval?.daysAwayFromEnding || 0
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
      if (!subscriptionInterval?.daysAwayFromEnding && dayIndex === 0) {
        return userAction
      }
      if (subscriptionInterval?.daysAwayFromEnding === dayIndex) {
        return userAction
      }
    })
  }

  function intervalDragEnd(dragEvent: DragEndEvent) {
    // todo: continue
    console.log(dragEvent.active.data, dragEvent.over?.data)
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
                      <SubscriptionInterval subscriptionNonUserAction={currentNonUserAction} />
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
                      <SubscriptionInterval subscriptionNonUserAction={currentNonUserAction} />
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
