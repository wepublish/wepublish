import React, {useContext, useRef} from 'react'
import {styled, TableCell} from '@mui/material'
import {IconButton, InputNumber, Popover, Tag, Whisper} from 'rsuite'
import {MdCheck, MdEdit, MdRefresh} from 'react-icons/all'
import {useTranslation} from 'react-i18next'
import {SubscriptionInterval} from '@wepublish/editor/api-v2'
import {GraphqlClientContext} from '../graphqlClientContext'
import {useAuthorisation} from '../../../../../../../apps/editor/src/app/atoms/permissionControl'

interface FlowHeadProps {
  days: (number | null | undefined)[]
  intervals: SubscriptionInterval[]
}

const PopoverBody = styled('div')<{wrap?: boolean}>`
  display: flex;
  min-width: 170px;
  justify-content: center;
`

export default function ({days, intervals}: FlowHeadProps) {
  const {t} = useTranslation()
  const canUpdateSubscriptionFlow = useAuthorisation('CAN_UPDATE_SUBSCRIPTION_FLOW')
  const editDay = useRef<number | undefined>(undefined)

  const client = useContext(GraphqlClientContext)

  async function updateTimelineDay(dayToUpdate: number) {
    if (editDay.current === undefined) {
      return
    }
    const intervalsToUpdate = intervals.filter(
      interval => interval?.daysAwayFromEnding === dayToUpdate
    )
    await client.updateSubscriptionIntervals({
      variables: {
        subscriptionIntervals: intervalsToUpdate.map(intervalToUpdate => {
          return {
            id: intervalToUpdate.id,
            mailTemplateId: intervalToUpdate.mailTemplate?.id,
            daysAwayFromEnding: editDay.current
          }
        })
      }
    })
  }
  return (
    <>
      {days.map(day => (
        <TableCell
          key={`day-${day}`}
          align="center"
          style={day === 0 ? {backgroundColor: 'lightyellow'} : {}}>
          {t('subscriptionFlow.dayWithNumber', {day})}
          {/* show badge on zero day */}
          {!day && (
            <>
              <br />
              <Tag color="blue">
                <MdRefresh size={20} style={{marginRight: '5px'}} />
                {t('subscriptionFlow.dayOfRenewal')}
              </Tag>
            </>
          )}
          {!!day && canUpdateSubscriptionFlow && (
            <Whisper
              placement="bottom"
              trigger="click"
              onClose={() => (editDay.current = undefined)}
              speaker={
                <Popover>
                  <PopoverBody>
                    <InputNumber
                      onChange={value => {
                        editDay.current = typeof value === 'string' ? parseInt(value) : value
                      }}
                      size="sm"
                      defaultValue={day || 0}
                      step={1}
                      postfix={t('subscriptionFlow.days')}
                    />
                    <IconButton
                      icon={<MdCheck />}
                      color={'green'}
                      appearance={'primary'}
                      style={{marginLeft: '5px'}}
                      onClick={() => updateTimelineDay(day as number)}
                    />
                  </PopoverBody>
                </Popover>
              }>
              <IconButton icon={<MdEdit />} size={'sm'} circle color={'blue'} appearance={'link'} />
            </Whisper>
          )}
        </TableCell>
      ))}
    </>
  )
}
