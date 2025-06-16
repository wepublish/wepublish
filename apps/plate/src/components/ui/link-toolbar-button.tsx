'use client'

import {useLinkToolbarButton, useLinkToolbarButtonState} from '@platejs/link/react'
import {Link} from 'lucide-react'

import {ToolbarButton} from './toolbar'
import {ComponentProps} from 'react'

export function LinkToolbarButton(props: ComponentProps<typeof ToolbarButton>) {
  const state = useLinkToolbarButtonState()
  const {props: buttonProps} = useLinkToolbarButton(state)

  return (
    <ToolbarButton {...props} {...buttonProps} data-plate-focus tooltip="Link">
      <Link />
    </ToolbarButton>
  )
}
