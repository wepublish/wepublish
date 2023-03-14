import React, {useContext} from 'react'
import DraggableSubscriptionInterval from '../draggableSubscriptionInterval'
import {SubscriptionEvent, SubscriptionFlowFragment} from '@wepublish/editor/api-v2'
import DroppableSubscriptionInterval from '../droppableSubscriptionInterval'
import {
  DecoratedSubscriptionInterval,
  IntervalColoring,
  MailTemplatesContext,
  NonUserActionInterval
} from '../subscriptionFlowList'
import {useTranslation} from 'react-i18next'
import {styled, TableCell} from '@mui/material'

interface TimelineBodyProps {
  days: (number | null | undefined)[]
  subscriptionFlow: SubscriptionFlowFragment
  eventIcons: {[key: string]: JSX.Element}
  eventColors: {[key: string]: IntervalColoring}
}

export default function ({days, subscriptionFlow, eventIcons, eventColors}: TimelineBodyProps) {
  const mailTemplates = useContext(MailTemplatesContext)
  const {t} = useTranslation()

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

  const TableCellBottom = styled(TableCell)`
    vertical-align: bottom;
  `

  return (
    <>
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
                  mailTemplates={mailTemplates}
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
                  mailTemplates={mailTemplates}
                />
              ))}
              <DroppableSubscriptionInterval dayIndex={day || 0} />
            </TableCellBottom>
          )
        })}
    </>
  )
}
