import {PlayOutline} from '@rsuite/icons'
import OffIcon from '@rsuite/icons/Off'
import WaitIcon from '@rsuite/icons/Wait'
import React from 'react'
import {useTranslation} from 'react-i18next'
import {Tooltip, Whisper} from 'rsuite'

import {dateTimeLocalString} from '../../utility'

interface PollStateIndicationPorps {
  closedAt: string | null | undefined
  opensAt: string
}

export function PollStateIndication({
  closedAt: pollClosedAt,
  opensAt: pollOpensAt
}: PollStateIndicationPorps) {
  const {t} = useTranslation()
  const now = new Date()
  const closedAt = pollClosedAt ? new Date(pollClosedAt) : undefined

  // poll has been closed
  if (closedAt && now.getTime() >= closedAt.getTime()) {
    return (
      <Whisper speaker={<Tooltip>{t('pollStateIndication.closed')}</Tooltip>}>
        <OffIcon style={{color: 'red'}} />
      </Whisper>
    )
  }

  // poll is open
  const opensAt = new Date(pollOpensAt)
  if (now.getTime() > opensAt.getTime()) {
    return (
      <Whisper speaker={<Tooltip>{t('pollStateIndication.open')}</Tooltip>}>
        <PlayOutline style={{color: 'green'}} />
      </Whisper>
    )
  }

  // poll is waiting to be opened
  return (
    <Whisper
      speaker={
        <Tooltip>
          {t('pollStateIndication.waiting', {date: dateTimeLocalString(new Date(pollOpensAt))})}
        </Tooltip>
      }>
      <WaitIcon />
    </Whisper>
  )
}
