import {PlayOutline} from '@rsuite/icons'
import OffIcon from '@rsuite/icons/Off'
import WaitIcon from '@rsuite/icons/Wait'
import React from 'react'

import {FullPoll} from '../../api'

interface PollStateIndicationPorps {
  poll: FullPoll
}

export function PollStateIndication({poll}: PollStateIndicationPorps) {
  const now = new Date()
  const closedAt = poll.closedAt ? new Date(poll.closedAt) : undefined

  // poll has been closed
  if (closedAt && now.getTime() >= closedAt.getTime()) {
    return (
      <>
        <OffIcon style={{color: 'red'}} />
      </>
    )
  }

  // poll is open
  const opensAt = new Date(poll.opensAt)
  if (now.getTime() > opensAt.getTime()) {
    return (
      <>
        <PlayOutline style={{color: 'green'}} />
      </>
    )
  }

  // poll is waiting to be opened
  return (
    <>
      <WaitIcon />
    </>
  )
}
